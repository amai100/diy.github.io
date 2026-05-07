const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const app = express();
const PORT = 3000;

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
// Session配置（登录状态管理）
app.use(
  session({
    secret: "your-secret-key-123456", // 自定义密钥，可修改
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 登录状态保留24小时
  }),
);

// 数据文件路径
const USERS_FILE = path.join(__dirname, "users.json");
const POSTS_FILE = path.join(__dirname, "posts.json");

// 初始化数据文件（无默认帖子、无默认用户）
function initFiles() {
  // 初始化用户文件
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  // 初始化帖子文件（无默认内容）
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
  }
}
initFiles();

// 工具函数：读取/保存数据
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// 登录校验中间件（未登录则拦截）
function checkLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, msg: "请先登录！" });
  }
  next();
}

// -------------------------- 用户接口 --------------------------
// 注册接口
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, msg: "账号/密码不能为空！" });
  }
  const users = readJson(USERS_FILE);
  // 检查账号是否已存在
  if (users.some((u) => u.username === username)) {
    return res.json({ success: false, msg: "账号已存在！" });
  }
  // 新增用户（ID用时间戳，唯一）
  const newUser = {
    id: Date.now(),
    username,
    password, // 注：生产环境需加密，这里简化
  };
  users.push(newUser);
  saveJson(USERS_FILE, users);
  res.json({ success: true, msg: "注册成功，请登录！" });
});

// 登录接口
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE);
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (!user) {
    return res.json({ success: false, msg: "账号或密码错误！" });
  }
  // 保存登录状态到session
  req.session.user = { id: user.id, username: user.username };
  res.json({ success: true, msg: "登录成功！" });
});

// 退出登录
app.get("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true, msg: "已退出登录！" });
});

// 获取当前登录用户信息
app.get("/api/currentUser", (req, res) => {
  res.json({ user: req.session.user || null });
});

// -------------------------- 帖子接口 --------------------------
// 获取所有帖子（带用户归属）
app.get("/api/posts", (req, res) => {
  const posts = readJson(POSTS_FILE);
  res.json(posts);
});

// 发布帖子（需登录，关联userId）
app.post("/api/posts", checkLogin, (req, res) => {
  const { title, content, time } = req.body;
  if (!title || !content) {
    return res.json({ success: false, msg: "标题/内容不能为空！" });
  }
  const posts = readJson(POSTS_FILE);
  const newPost = {
    id: Date.now(),
    title,
    content,
    time,
    like: 0,
    userId: req.session.user.id, // 关联发布者ID
    username: req.session.user.username, // 保存发布者昵称
    comments: [],
  };
  posts.unshift(newPost); // 置顶
  saveJson(POSTS_FILE, posts);
  res.json({ success: true, posts });
});

// 帖子点赞
app.post("/api/posts/like/:postId", checkLogin, (req, res) => {
  const { postId } = req.params;
  const posts = readJson(POSTS_FILE);
  const post = posts.find((p) => p.id == postId);
  if (!post) return res.json({ success: false, msg: "帖子不存在！" });

  post.like++;
  saveJson(POSTS_FILE, posts);
  res.json({ success: true, posts });
});

// 删除帖子（仅发布者可删）
app.delete("/api/posts/:postId", checkLogin, (req, res) => {
  const { postId } = req.params;
  const userId = req.session.user.id;
  let posts = readJson(POSTS_FILE);
  // 检查帖子是否存在，且是否为当前用户发布
  const post = posts.find((p) => p.id == postId);
  if (!post) return res.json({ success: false, msg: "帖子不存在！" });
  if (post.userId != userId)
    return res.json({ success: false, msg: "无权删除他人帖子！" });

  posts = posts.filter((p) => p.id != postId);
  saveJson(POSTS_FILE, posts);
  res.json({ success: true, posts });
});

// -------------------------- 评论接口 --------------------------
// 添加评论（需登录，关联userId）
app.post("/api/posts/:postId/comments", checkLogin, (req, res) => {
  const { postId } = req.params;
  const { content, time } = req.body;
  if (!content) return res.json({ success: false, msg: "评论不能为空！" });

  const posts = readJson(POSTS_FILE);
  const post = posts.find((p) => p.id == postId);
  if (!post) return res.json({ success: false, msg: "帖子不存在！" });

  const newComment = {
    id: Date.now(),
    content,
    time,
    like: 0,
    userId: req.session.user.id, // 关联评论者ID
    username: req.session.user.username, // 保存评论者昵称
    replies: [], // 新增：回复数组
  };
  post.comments.push(newComment);
  saveJson(POSTS_FILE, posts);
  res.json({ success: true, posts });
});

// 评论点赞
app.post("/api/comments/like/:commentId", checkLogin, (req, res) => {
  const { commentId } = req.params;
  const posts = readJson(POSTS_FILE);
  let commentFound = false;

  for (let post of posts) {
    const comment = post.comments.find((c) => c.id == commentId);
    if (comment) {
      comment.like++;
      commentFound = true;
      break;
    }
  }
  if (!commentFound) return res.json({ success: false, msg: "评论不存在！" });

  saveJson(POSTS_FILE, posts);
  res.json({ success: true, posts });
});

// 删除评论（仅发布者可删）
app.delete("/api/posts/:postId/comments/:commentId", checkLogin, (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.session.user.id;
  const posts = readJson(POSTS_FILE);

  const post = posts.find((p) => p.id == postId);
  if (!post) return res.json({ success: false, msg: "帖子不存在！" });

  const comment = post.comments.find((c) => c.id == commentId);
  if (!comment) return res.json({ success: false, msg: "评论不存在！" });
  if (comment.userId != userId)
    return res.json({ success: false, msg: "无权删除他人评论！" });

  post.comments = post.comments.filter((c) => c.id != commentId);
  saveJson(POSTS_FILE, posts);
  res.json({ success: true, posts });
});

// -------------------------- 回复接口（新增） --------------------------
// 添加回复
app.post(
  "/api/posts/:postId/comments/:commentId/replies",
  checkLogin,
  (req, res) => {
    const { postId, commentId } = req.params;
    const { content, time } = req.body;
    if (!content)
      return res.json({ success: false, msg: "回复内容不能为空！" });

    const posts = readJson(POSTS_FILE);
    const post = posts.find((p) => p.id == postId);
    if (!post) return res.json({ success: false, msg: "帖子不存在！" });

    const comment = post.comments.find((c) => c.id == commentId);
    if (!comment) return res.json({ success: false, msg: "评论不存在！" });

    const newReply = {
      id: Date.now(),
      content,
      time,
      userId: req.session.user.id,
      username: req.session.user.username,
    };
    comment.replies.push(newReply);
    saveJson(POSTS_FILE, posts);
    res.json({ success: true, posts });
  },
);

// 删除回复
app.delete(
  "/api/posts/:postId/comments/:commentId/replies/:replyId",
  checkLogin,
  (req, res) => {
    const { postId, commentId, replyId } = req.params;
    const userId = req.session.user.id;
    const posts = readJson(POSTS_FILE);

    const post = posts.find((p) => p.id == postId);
    if (!post) return res.json({ success: false, msg: "帖子不存在！" });

    const comment = post.comments.find((c) => c.id == commentId);
    if (!comment) return res.json({ success: false, msg: "评论不存在！" });

    const reply = comment.replies.find((r) => r.id == replyId);
    if (!reply) return res.json({ success: false, msg: "回复不存在！" });
    if (reply.userId != userId)
      return res.json({ success: false, msg: "无权删除他人回复！" });

    comment.replies = comment.replies.filter((r) => r.id != replyId);
    saveJson(POSTS_FILE, posts);
    res.json({ success: true, posts });
  },
);

// 启动服务
app.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`);
  console.log("访问 http://localhost:3000/login.html 进入登录页");
});
