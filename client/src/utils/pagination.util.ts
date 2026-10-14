export const MAX_PAGE_LIMIT = 50;
export function pageLimit(value: unknown, fallback = 20): number {
 const parsed = Number(value);
 return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, MAX_PAGE_LIMIT) : Math.min(Math.max(1, fallback), MAX_PAGE_LIMIT);
}
export function pageLimitOptions(options: number[], current: number): number[] {
 return [...new Set([...options.filter(value => Number.isInteger(value) && value > 0).map(value => pageLimit(value)), pageLimit(current)])].sort((a,b) => a-b);
}
export function paginationState(input: { page:number; limit:number; total_items:number }) {
 const limit = pageLimit(input.limit);
 const total_items = Number.isFinite(input.total_items) ? Math.max(0,Math.floor(input.total_items)) : 0;
 const total_pages = total_items ? Math.ceil(total_items / limit) : 0;
 const page = Math.min(Math.max(1, Number.isInteger(input.page) ? input.page : 1), Math.max(1,total_pages));
 return { page, limit, total_items, total_pages, has_previous_page:page > 1, has_next_page:page < total_pages };
}
