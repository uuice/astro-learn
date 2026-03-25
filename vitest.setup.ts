/** 在加载 lowdb 之前执行：避免 `NODE_ENV=test` 走 Memory 适配器导致删文件无法隔离 */
process.env.NODE_ENV = 'development'
