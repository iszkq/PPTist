import JSZip from 'jszip'
import type { AnimationTrigger, AnimationType, PPTAnimation, TurningMode } from '@/types/slides'

interface RawAnimation {
  targetIndexes: number[]
  targetNames: string[]
  targetBounds: string[]
  effect: string
  type: AnimationType
  duration: number
  trigger: AnimationTrigger
  supported: boolean
  timelineKey: string
  priority: number
}

export interface PptxAnimationElementRefs {
  idsByIndex: string[]
  idsByName: Map<string, string[]>
  idsByBounds: Map<string, string[]>
}

export interface PptxAnimationImport {
  slideAnimations: RawAnimation[][]
  sourceElementCounts: number[]
  turningModes: (TurningMode | undefined)[]
  unsupportedCount: number
}

const slideTransitionMap: Record<string, TurningMode> = {
  fade: 'fade', push: 'slideX', wipe: 'slideX', cover: 'slideX', pull: 'slideX',
  split: 'scale', zoom: 'scale', randomBar: 'slideY',
}
const leafShapeTags = ['p:sp', 'p:pic', 'p:cxnSp', 'p:graphicFrame']
const emuToPoint = 72 / 914400

const getDirectChild = (node: Element | undefined, tagName: string) => node && Array.from(node.children).find(child => child.tagName === tagName)
const getNonVisual = (shape: Element) => getDirectChild(shape, 'p:nvSpPr') || getDirectChild(shape, 'p:nvPicPr') || getDirectChild(shape, 'p:nvCxnSpPr') || getDirectChild(shape, 'p:nvGraphicFramePr') || getDirectChild(shape, 'p:nvGrpSpPr')
const getShapeId = (shape: Element) => getDirectChild(getNonVisual(shape), 'p:cNvPr')?.getAttribute('id')
const getShapeName = (shape: Element) => getDirectChild(getNonVisual(shape), 'p:cNvPr')?.getAttribute('name')

const getBoundsKey = (left: number, top: number, width: number, height: number) => [left, top, width, height].map(value => Math.round(value * 100) / 100).join('|')
const getShapeBounds = (shape: Element) => {
  const shapeProperties = getDirectChild(shape, 'p:spPr')
  const xfrm = getDirectChild(shapeProperties, 'a:xfrm') || getDirectChild(shape, 'p:xfrm')
  const off = getDirectChild(xfrm, 'a:off')
  const ext = getDirectChild(xfrm, 'a:ext')
  const values = [off?.getAttribute('x'), off?.getAttribute('y'), ext?.getAttribute('cx'), ext?.getAttribute('cy')].map(value => Number(value))
  if (values.some(value => !Number.isFinite(value))) return undefined
  return getBoundsKey(values[0] * emuToPoint, values[1] * emuToPoint, values[2] * emuToPoint, values[3] * emuToPoint)
}

interface ShapeTarget { indexes: number[]; names: string[]; bounds: string[] }

const getShapeTargetMap = (document: Document) => {
  const targetsByShapeId = new Map<string, ShapeTarget>()
  let leafIndex = 0
  const walk = (parent: Element) => {
    const shapes = Array.from(parent.children).filter(child => leafShapeTags.includes(child.tagName) || child.tagName === 'p:grpSp')
    for (const shape of shapes) {
      const id = getShapeId(shape)
      if (shape.tagName === 'p:grpSp') {
        const startIndex = leafIndex
        walk(shape)
        if (id) {
          const childTargets = Array.from(targetsByShapeId.values())
            .flatMap(target => target.indexes.map((index, childIndex) => ({ index, name: target.names[childIndex], bounds: target.bounds[childIndex] })))
            .filter(target => target.index >= startIndex && target.index < leafIndex)
          targetsByShapeId.set(id, {
            indexes: childTargets.map(target => target.index),
            names: childTargets.map(target => target.name).filter((name): name is string => Boolean(name)),
            bounds: childTargets.map(target => target.bounds).filter((bounds): bounds is string => Boolean(bounds)),
          })
        }
      }
      else {
        if (id) targetsByShapeId.set(id, {
          indexes: [leafIndex],
          names: getShapeName(shape) ? [getShapeName(shape)!] : [],
          bounds: getShapeBounds(shape) ? [getShapeBounds(shape)!] : [],
        })
        leafIndex++
      }
    }
  }
  const shapeTree = document.getElementsByTagName('p:spTree')[0]
  if (shapeTree) walk(shapeTree)
  return { targetsByShapeId, leafCount: leafIndex }
}

const getDuration = (node: Element) => {
  const ownDuration = Number(node.getElementsByTagName('p:cTn')[0]?.getAttribute('dur'))
  if (Number.isFinite(ownDuration) && ownDuration > 0) return Math.min(Math.max(ownDuration, 100), 20000)
  let current: Element | null = node
  while (current) {
    const duration = Number(current.getAttribute('dur'))
    if (Number.isFinite(duration) && duration > 0) return Math.min(Math.max(duration, 100), 20000)
    current = current.parentElement
  }
  return 1000
}

const getPresetClass = (node: Element) => {
  let current: Element | null = node
  while (current) {
    const presetClass = current.getAttribute('presetClass')
    if (presetClass) return presetClass
    current = current.parentElement
  }
  return ''
}
const getAnimationType = (node: Element, fallback: AnimationType = 'attention'): AnimationType => {
  const presetClass = getPresetClass(node)
  if (presetClass === 'entr') return 'in'
  if (presetClass === 'exit') return 'out'
  return fallback
}
const getTimelineKey = (node: Element) => {
  let current: Element | null = node
  while (current) {
    if (current.tagName === 'p:cTn' && current.getAttribute('nodeType')) return current.getAttribute('id') || current.getAttribute('nodeType') || 'timing'
    current = current.parentElement
  }
  return `node-${node.getAttribute('id') || node.tagName}`
}
const getTrigger = (node: Element): AnimationTrigger => {
  const conditions = Array.from(node.getElementsByTagName('p:cond'))
  if (conditions.some(item => item.getAttribute('evt') === 'onEnd')) return 'auto'
  if (conditions.some(item => item.getAttribute('evt') === 'onClick' || item.getAttribute('delay') === 'indefinite')) return 'click'
  let current: Element | null = node
  while (current) {
    const nodeType = current.getAttribute('nodeType')
    if (nodeType === 'withEffect') return 'meantime'
    if (nodeType === 'afterEffect') return 'auto'
    if (nodeType === 'clickEffect' || nodeType === 'clickPar') return 'click'
    current = current.parentElement
  }
  return 'click'
}

const getDirection = (filter: string) => {
  if (/fromRight|r\)/i.test(filter)) return 'Right'
  if (/fromTop|fromUp|u\)/i.test(filter)) return 'Up'
  if (/fromBottom|fromDown|d\)/i.test(filter)) return 'Down'
  return 'Left'
}
const getMotionDirection = (node: Element, type: AnimationType) => {
  const numbers = (node.getAttribute('path') || '').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/ig)?.map(Number) || []
  const dx = numbers.length >= 2 ? numbers[numbers.length - 2] : 0
  const dy = numbers.length >= 1 ? numbers[numbers.length - 1] : 0
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? (type === 'in' ? 'Left' : 'Right') : (type === 'in' ? 'Right' : 'Left')
  return dy > 0 ? (type === 'in' ? 'Up' : 'Down') : (type === 'in' ? 'Down' : 'Up')
}
const mapEffect = (node: Element) => {
  const filter = node.getAttribute('filter') || ''
  const type: AnimationType = node.getAttribute('transition') === 'out' ? 'out' : getAnimationType(node, 'in')
  const normalized = filter.toLowerCase()
  if (/fade|dissolve|appear/.test(normalized)) return { effect: type === 'out' ? 'fadeOut' : 'fadeIn', type, supported: true, priority: 5 }
  if (/zoom|grow|shrink|expand|contract/.test(normalized)) return { effect: type === 'out' ? 'zoomOut' : 'zoomIn', type, supported: true, priority: 5 }
  if (/rise|ascend|upward/.test(normalized)) return { effect: type === 'out' ? 'fadeOutUp' : 'fadeInUp', type, supported: true, priority: 5 }
  if (/sink|descend|downward/.test(normalized)) return { effect: type === 'out' ? 'fadeOutDown' : 'fadeInDown', type, supported: true, priority: 5 }
  if (/fly|wipe|peek|crawl/.test(normalized)) return { effect: `${type === 'out' ? 'fadeOut' : 'fadeIn'}${getDirection(filter)}`, type, supported: true, priority: 5 }
  if (/wheel|split|strips|blinds|checkerboard|circle|diamond|random/.test(normalized)) return { effect: type === 'out' ? 'fadeOut' : 'fadeIn', type, supported: false, priority: 5 }
  return { effect: type === 'out' ? 'fadeOut' : 'fadeIn', type, supported: false, priority: 5 }
}
const mapAnimationNode = (node: Element) => {
  if (node.tagName === 'p:animEffect') return mapEffect(node)
  const type = getAnimationType(node)
  if (node.tagName === 'p:animMotion') return { effect: `${type === 'out' ? 'fadeOut' : 'fadeIn'}${getMotionDirection(node, type === 'attention' ? 'in' : type)}`, type: type === 'attention' ? 'in' as AnimationType : type, supported: false, priority: 4 }
  if (node.tagName === 'p:animScale') return { effect: type === 'in' ? 'zoomIn' : type === 'out' ? 'zoomOut' : 'pulse', type, supported: true, priority: 3 }
  if (node.tagName === 'p:animRot') return { effect: type === 'in' ? 'rotateIn' : type === 'out' ? 'rotateOut' : 'swing', type, supported: true, priority: 2 }
  return { effect: 'flash', type: 'attention' as AnimationType, supported: true, priority: 1 }
}
const getTargetIds = (node: Element) => Array.from(node.getElementsByTagName('p:spTgt')).map(target => target.getAttribute('spid')).filter((id): id is string => Boolean(id))

const extractSlideAnimations = (document: Document) => {
  const { targetsByShapeId, leafCount } = getShapeTargetMap(document)
  const timing = document.getElementsByTagName('p:timing')[0]
  if (!timing) return { animations: [], sourceElementCount: leafCount }
  const animationNodes = Array.from(timing.getElementsByTagName('*')).filter(node => ['p:animEffect', 'p:animMotion', 'p:animScale', 'p:animRot', 'p:animClr'].includes(node.tagName))
  const animationByKey = new Map<string, RawAnimation>()
  for (const node of animationNodes) {
    const targets = getTargetIds(node).flatMap(id => targetsByShapeId.get(id) ? [targetsByShapeId.get(id)!] : [])
    const targetIndexes = [...new Set(targets.flatMap(target => target.indexes))]
    if (!targetIndexes.length) continue
    const mapped = mapAnimationNode(node)
    const timelineKey = getTimelineKey(node)
    const rawAnimation: RawAnimation = {
      targetIndexes,
      targetNames: [...new Set(targets.flatMap(target => target.names))],
      targetBounds: [...new Set(targets.flatMap(target => target.bounds))],
      effect: mapped.effect,
      type: mapped.type,
      duration: getDuration(node),
      trigger: getTrigger(node),
      supported: mapped.supported,
      timelineKey,
      priority: mapped.priority,
    }
    const key = `${timelineKey}:${rawAnimation.trigger}:${targetIndexes.join(',')}`
    const previous = animationByKey.get(key)
    if (!previous || rawAnimation.priority > previous.priority) animationByKey.set(key, rawAnimation)
  }
  return { animations: [...animationByKey.values()], sourceElementCount: leafCount }
}

const getTurningMode = (document: Document): TurningMode | undefined => {
  const transition = document.getElementsByTagName('p:transition')[0]
  const effectNode = transition && Array.from(transition.children)[0]
  return effectNode ? slideTransitionMap[effectNode.tagName.replace('p:', '')] : undefined
}

export const extractPptxAnimations = async (file: ArrayBuffer): Promise<PptxAnimationImport> => {
  const zip = await JSZip.loadAsync(file)
  const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]))
  const slideAnimations: RawAnimation[][] = []
  const sourceElementCounts: number[] = []
  const turningModes: (TurningMode | undefined)[] = []
  let unsupportedCount = 0
  for (const fileName of slideFiles) {
    const xml = await zip.file(fileName)?.async('text')
    const extracted = extractSlideAnimations(new DOMParser().parseFromString(xml || '', 'application/xml'))
    unsupportedCount += extracted.animations.filter(animation => !animation.supported).length
    slideAnimations.push(extracted.animations)
    sourceElementCounts.push(extracted.sourceElementCount)
    turningModes.push(getTurningMode(new DOMParser().parseFromString(xml || '', 'application/xml')))
  }
  return { slideAnimations, sourceElementCounts, turningModes, unsupportedCount }
}

export const mapPptxAnimations = (animations: RawAnimation[], elementRefs: PptxAnimationElementRefs | string[]): PPTAnimation[] => {
  const refs: PptxAnimationElementRefs = Array.isArray(elementRefs) ? { idsByIndex: elementRefs, idsByName: new Map(), idsByBounds: new Map() } : elementRefs
  return animations.flatMap((animation, animationIndex) => {
    const namedIds = animation.targetNames.flatMap(name => refs.idsByName.get(name) || [])
    const boundsIds = animation.targetBounds.flatMap(bounds => refs.idsByBounds.get(bounds) || [])
    const elementIds = [...new Set(namedIds.length ? namedIds : boundsIds.length ? boundsIds : animation.targetIndexes.map(index => refs.idsByIndex[index]).filter(Boolean))]
    return elementIds.map((elId, targetOrder) => ({ id: `${elId}-${animation.timelineKey}-${animationIndex}-${targetOrder}`, elId, effect: animation.effect, type: animation.type, duration: animation.duration, trigger: animation.trigger }))
  })
}
