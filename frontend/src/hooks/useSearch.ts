import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchApi, type SearchParams } from '../api/search'
import type { Listing } from '../types/listing'

interface UseSearchState {
  results: Listing[]
  loading: boolean
  error: string | null
  total: number
  page: number
  pages: number
}

export default function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState<UseSearchState>({
    results: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    pages: 1,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getParams = useCallback((): SearchParams => {
    const params: SearchParams = {}
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const condition = searchParams.get('condition')
    const sort_by = searchParams.get('sort_by')
    const page = searchParams.get('page')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius_km = searchParams.get('radius_km')

    if (q) params.q = q
    if (category) params.category = category
    if (min_price) params.min_price = Number(min_price)
    if (max_price) params.max_price = Number(max_price)
    if (condition) params.condition = condition
    if (sort_by) params.sort_by = sort_by
    if (page) params.page = Number(page)
    if (lat) params.lat = Number(lat)
    if (lng) params.lng = Number(lng)
    if (radius_km) params.radius_km = Number(radius_km)

    params.per_page = 24
    return params
  }, [searchParams])

  const fetchResults = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const params = getParams()
      const { data } = await searchApi.search(params)
      setState({
        results: data.items,
        total: data.total,
        page: data.page,
        pages: data.pages,
        loading: false,
        error: null,
      })
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Error al buscar. Intenta nuevamente.',
      }))
    }
  }, [getParams])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const updateParams = useCallback(
    (updates: Record<string, string | null>, debounce = false) => {
      const apply = () => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '') {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          }
          // Reset to page 1 when filters change (unless page itself is being set)
          if (!('page' in updates)) {
            next.delete('page')
          }
          return next
        })
      }

      if (debounce) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(apply, 300)
      } else {
        apply()
      }
    },
    [setSearchParams],
  )

  const setQuery = useCallback(
    (q: string) => updateParams({ q: q || null }, true),
    [updateParams],
  )

  const setCategory = useCallback(
    (category: string | null) => updateParams({ category }),
    [updateParams],
  )

  const setPriceRange = useCallback(
    (min?: number, max?: number) =>
      updateParams({
        min_price: min != null ? String(min) : null,
        max_price: max != null ? String(max) : null,
      }),
    [updateParams],
  )

  const setConditions = useCallback(
    (condition: string | null) => updateParams({ condition }),
    [updateParams],
  )

  const setSort = useCallback(
    (sort_by: string | null) => updateParams({ sort_by }),
    [updateParams],
  )

  const setPage = useCallback(
    (page: number) => updateParams({ page: String(page) }),
    [updateParams],
  )

  const setLocation = useCallback(
    (lat?: number, lng?: number, radius_km?: number) =>
      updateParams({
        lat: lat != null ? String(lat) : null,
        lng: lng != null ? String(lng) : null,
        radius_km: radius_km != null ? String(radius_km) : null,
      }),
    [updateParams],
  )

  return {
    ...state,
    query: searchParams.get('q') || '',
    filters: {
      category: searchParams.get('category') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      condition: searchParams.get('condition') || '',
      sort_by: searchParams.get('sort_by') || '',
      lat: searchParams.get('lat') || '',
      lng: searchParams.get('lng') || '',
      radius_km: searchParams.get('radius_km') || '',
    },
    setQuery,
    setCategory,
    setPriceRange,
    setConditions,
    setSort,
    setPage,
    setLocation,
  }
}
