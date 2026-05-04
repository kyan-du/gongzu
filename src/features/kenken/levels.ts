import type { KenKenPuzzle } from './types';

export const KENKEN_LEVELS: KenKenPuzzle[] = [
  { id:'k1', title:'入门：加减热身', size:4, solution:[[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1}],target:3,op:'+'}, {id:'b',cells:[{row:0,col:2},{row:0,col:3}],target:1,op:'-'},
    {id:'c',cells:[{row:1,col:0},{row:2,col:0}],target:1,op:'-'}, {id:'d',cells:[{row:1,col:1},{row:1,col:2}],target:5,op:'+'},
    {id:'e',cells:[{row:1,col:3},{row:2,col:3}],target:1,op:'-'}, {id:'f',cells:[{row:2,col:1},{row:3,col:1}],target:4,op:'+'},
    {id:'g',cells:[{row:2,col:2},{row:3,col:2}],target:8,op:'×'}, {id:'h',cells:[{row:3,col:0},{row:3,col:3}],target:4,op:'÷'},
  ]},
  { id:'k2', title:'乘法：找因数', size:4, solution:[[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:1,col:0}],target:8,op:'×'}, {id:'b',cells:[{row:0,col:1},{row:0,col:2}],target:4,op:'×'},
    {id:'c',cells:[{row:0,col:3},{row:1,col:3}],target:3,op:'×'}, {id:'d',cells:[{row:1,col:1},{row:1,col:2}],target:1,op:'-'},
    {id:'e',cells:[{row:2,col:0},{row:2,col:1}],target:3,op:'+'}, {id:'f',cells:[{row:2,col:2},{row:3,col:2}],target:3,op:'÷'},
    {id:'g',cells:[{row:2,col:3},{row:3,col:3}],target:2,op:'÷'}, {id:'h',cells:[{row:3,col:0},{row:3,col:1}],target:12,op:'×'},
  ]},
  { id:'k3', title:'除法：配对推理', size:4, solution:[[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1}],target:1,op:'-'}, {id:'b',cells:[{row:0,col:2},{row:1,col:2}],target:3,op:'÷'},
    {id:'c',cells:[{row:0,col:3},{row:1,col:3}],target:2,op:'÷'}, {id:'d',cells:[{row:1,col:0},{row:1,col:1}],target:3,op:'+'},
    {id:'e',cells:[{row:2,col:0},{row:3,col:0}],target:2,op:'÷'}, {id:'f',cells:[{row:2,col:1},{row:2,col:2}],target:6,op:'×'},
    {id:'g',cells:[{row:2,col:3},{row:3,col:3}],target:4,op:'+'}, {id:'h',cells:[{row:3,col:1},{row:3,col:2}],target:4,op:'×'},
  ]},
  { id:'k4', title:'综合：四则混合', size:4, solution:[[4,3,2,1],[2,1,4,3],[3,4,1,2],[1,2,3,4]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1}],target:12,op:'×'}, {id:'b',cells:[{row:0,col:2},{row:1,col:2}],target:8,op:'×'},
    {id:'c',cells:[{row:0,col:3},{row:1,col:3}],target:4,op:'+'}, {id:'d',cells:[{row:1,col:0},{row:2,col:0}],target:1,op:'-'},
    {id:'e',cells:[{row:1,col:1},{row:2,col:1}],target:4,op:'÷'}, {id:'f',cells:[{row:2,col:2},{row:2,col:3}],target:3,op:'+'},
    {id:'g',cells:[{row:3,col:0},{row:3,col:1}],target:3,op:'+'}, {id:'h',cells:[{row:3,col:2},{row:3,col:3}],target:12,op:'×'},
  ]},

  { id:'k5', title:'提高：三格加法', size:4, solution:[[1,3,4,2],[4,2,1,3],[2,4,3,1],[3,1,2,4]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1},{row:1,col:1}],target:6,op:'+'}, {id:'b',cells:[{row:0,col:2},{row:0,col:3}],target:2,op:'÷'},
    {id:'c',cells:[{row:1,col:0},{row:2,col:0}],target:2,op:'÷'}, {id:'d',cells:[{row:1,col:2},{row:1,col:3}],target:3,op:'×'},
    {id:'e',cells:[{row:2,col:1},{row:2,col:2},{row:3,col:2}],target:9,op:'+'}, {id:'f',cells:[{row:2,col:3},{row:3,col:3}],target:4,op:'×'},
    {id:'g',cells:[{row:3,col:0},{row:3,col:1}],target:3,op:'÷'},
  ]},
  { id:'k6', title:'提高：乘法拆因数', size:4, solution:[[2,4,1,3],[1,3,4,2],[4,2,3,1],[3,1,2,4]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:1,col:0}],target:2,op:'×'}, {id:'b',cells:[{row:0,col:1},{row:1,col:1}],target:12,op:'×'},
    {id:'c',cells:[{row:0,col:2},{row:0,col:3},{row:1,col:3}],target:6,op:'×'}, {id:'d',cells:[{row:1,col:2},{row:2,col:2}],target:12,op:'×'},
    {id:'e',cells:[{row:2,col:0},{row:2,col:1}],target:2,op:'÷'}, {id:'f',cells:[{row:2,col:3},{row:3,col:3}],target:4,op:'÷'},
    {id:'g',cells:[{row:3,col:0},{row:3,col:1},{row:3,col:2}],target:6,op:'×'},
  ]},
  { id:'k7', title:'挑战：加乘混合', size:4, solution:[[3,1,2,4],[2,4,3,1],[4,2,1,3],[1,3,4,2]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1}],target:2,op:'-'}, {id:'b',cells:[{row:0,col:2},{row:1,col:2},{row:1,col:3}],target:6,op:'×'},
    {id:'c',cells:[{row:0,col:3},{row:1,col:3}],target:4,op:'÷'}, {id:'d',cells:[{row:1,col:0},{row:1,col:1}],target:6,op:'+'},
    {id:'e',cells:[{row:2,col:0},{row:3,col:0}],target:4,op:'÷'}, {id:'f',cells:[{row:2,col:1},{row:2,col:2}],target:2,op:'÷'},
    {id:'g',cells:[{row:2,col:3},{row:3,col:3}],target:1,op:'-'}, {id:'h',cells:[{row:3,col:1},{row:3,col:2}],target:12,op:'×'},
  ]},
  { id:'k8', title:'挑战：少笼大数', size:4, solution:[[4,2,3,1],[1,3,4,2],[2,4,1,3],[3,1,2,4]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1},{row:1,col:1}],target:24,op:'×'}, {id:'b',cells:[{row:0,col:2},{row:0,col:3}],target:2,op:'-'},
    {id:'c',cells:[{row:1,col:0},{row:2,col:0}],target:3,op:'+'}, {id:'d',cells:[{row:1,col:2},{row:1,col:3},{row:2,col:3}],target:24,op:'×'},
    {id:'e',cells:[{row:2,col:1},{row:2,col:2}],target:3,op:'-'}, {id:'f',cells:[{row:3,col:0},{row:3,col:1}],target:2,op:'-'},
    {id:'g',cells:[{row:3,col:2},{row:3,col:3}],target:8,op:'×'},
  ]},
  { id:'k9', title:'高阶：连续排除', size:4, solution:[[2,3,1,4],[4,1,3,2],[1,4,2,3],[3,2,4,1]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1}],target:5,op:'+'}, {id:'b',cells:[{row:0,col:2},{row:1,col:2}],target:3,op:'÷'},
    {id:'c',cells:[{row:0,col:3},{row:1,col:3}],target:2,op:'÷'}, {id:'d',cells:[{row:1,col:0},{row:2,col:0}],target:5,op:'+'},
    {id:'e',cells:[{row:1,col:1},{row:2,col:1},{row:2,col:2}],target:7,op:'+'}, {id:'f',cells:[{row:2,col:3},{row:3,col:3}],target:3,op:'÷'},
    {id:'g',cells:[{row:3,col:0},{row:3,col:1}],target:1,op:'-'}, {id:'h',cells:[{row:3,col:2}],target:4,op:'='},
  ]},
  { id:'k10', title:'高阶：综合十关', size:4, solution:[[3,4,2,1],[1,2,4,3],[4,3,1,2],[2,1,3,4]], cages:[
    {id:'a',cells:[{row:0,col:0},{row:0,col:1}],target:12,op:'×'}, {id:'b',cells:[{row:0,col:2},{row:0,col:3},{row:1,col:3}],target:6,op:'+'},
    {id:'c',cells:[{row:1,col:0},{row:1,col:1}],target:3,op:'+'}, {id:'d',cells:[{row:1,col:2},{row:2,col:2}],target:4,op:'÷'},
    {id:'e',cells:[{row:2,col:0},{row:2,col:1}],target:1,op:'-'}, {id:'f',cells:[{row:2,col:3},{row:3,col:3}],target:2,op:'÷'},
    {id:'g',cells:[{row:3,col:0},{row:3,col:1},{row:3,col:2}],target:6,op:'+'},
  ]},
];
