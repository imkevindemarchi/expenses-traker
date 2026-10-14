import { test } from "node:test";
import assert from "node:assert/strict";
import { pageLimit, pageLimitOptions, paginationState } from "../src/utils/pagination.util.ts";
test("page sizes preserve smaller choices and cap oversized input",()=>{
 for(const value of [5,10,20,50]) assert.equal(pageLimit(value),value);
 for(const value of [51,100,200,500,10000]) assert.equal(pageLimit(value),50);
 for(const value of [undefined,null,0,-1,2.5,"bad",Infinity]) assert.equal(pageLimit(value),20);
 assert.deepEqual(pageLimitOptions([5,10,20,100,200,500],10),[5,10,20,50]);
 assert.deepEqual(pageLimitOptions([10,20,50],15),[10,15,20,50]);
});
test("deleting the final row clamps to the preceding page; empty data has no navigation",()=>{
 assert.deepEqual(paginationState({page:3,limit:20,total_items:40}),{page:2,limit:20,total_items:40,total_pages:2,has_previous_page:true,has_next_page:false});
 assert.deepEqual(paginationState({page:9,limit:20,total_items:0}),{page:1,limit:20,total_items:0,total_pages:0,has_previous_page:false,has_next_page:false});
 assert.equal(paginationState({page:1,limit:100,total_items:120}).total_pages,3);
});
