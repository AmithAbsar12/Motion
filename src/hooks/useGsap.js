import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGsap(callback, scope, dependencies = []) {
  useLayoutEffect(() => {
    const context = gsap.context(callback, scope)
    return () => context.revert()
  }, dependencies)
}

export { gsap, ScrollTrigger }
