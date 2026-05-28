# 串口调试工具 Serial Tool

基于 **TypeScript + React + Tauri + serialport** 技术栈开发的现代化串口调试工具，支持最高 2M 波特率。

## ✨ 功能特性

### 核心功能
- ✅ **自动扫描串口** - 自动检测并列出系统所有可用串口
- ✅ **高波特率支持** - 最高支持 2000000 (2M) 波特率
- ✅ **完整串口配置** - 波特率、数据位、停止位、校验位可配置
- ✅ **双模式收发** - 支持普通文本和十六进制两种模式
- ✅ **实时数据接收** - 自动轮询读取串口数据
- ✅ **自动滚动** - 接收区支持自动滚动和手动控制

### 支持的波特率
9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1000000, **2000000**

### 界面特性
- 🎨 **深色主题** - 现代化深色界面设计
- 💻 **响应式布局** - 自适应窗口大小
- ⚡ **轻量高效** - Tauri 架构，内存占用低，启动快

## 📦 项目结构

```
serial-tool/
├── src/                          # 前端 React 代码
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 应用入口
│   └── index.css                 # 全局样式
├── src-tauri/                    # Rust 后端代码
│   ├── src/
│   │   └── main.rs               # Tauri 主程序 + 串口通信实现
│   ├── Cargo.toml                # Rust 依赖配置
│   ├── tauri.conf.json           # Tauri 应用配置
│   └── build.rs                  # 构建脚本
├── index.html                    # HTML 入口
├── package.json                  # NPM 依赖配置
├── vite.config.ts                # Vite 构建配置
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.js            # Tailwind CSS 配置
└── postcss.config.js             # PostCSS 配置
```

## 🛠️ 开发环境搭建

### 前置要求

#### 1. 安装 Rust
Windows 系统：
1. 下载并安装 [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 下载并安装 [Rust](https://www.rust-lang.org/tools/install)
```powershell
# 验证安装
rustc --version
cargo --version
```

#### 2. 安装 Node.js
- 下载 Node.js 18+ 版本：https://nodejs.org/
```powershell
# 验证安装
node --version
npm --version
```

#### 3. 安装 WebView2 (Windows 10)
Windows 10 需要安装 WebView2 Runtime：
- 下载地址：https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/

### 安装项目依赖

```powershell
# 进入项目目录
cd serial-tool

# 安装 npm 依赖
npm install
```

## 🚀 开发运行

```powershell
# 启动开发模式（热重载）
npm run tauri dev
```

首次运行会下载 Rust 依赖，可能需要几分钟时间。

## 📦 编译打包 Windows 可执行文件

### 方式一：开发环境编译

```powershell
# 构建生产版本
npm run tauri build
```

编译完成后，可执行文件位于：
```
src-tauri/target/release/serial-tool.exe
```

安装包位于：
```
src-tauri/target/release/bundle/msi/serial-tool_1.0.0_x64_en-US.msi
```

### 方式二：单文件便携版

修改 `src-tauri/tauri.conf.json`，在 `bundle` 中添加：
```json
"bundle": {
  "windows": {
    "wix": {
      "language": ["zh-CN"]
    }
  }
}
```

## 📖 使用说明

### 1. 连接串口设备
1. 将串口设备连接到电脑
2. 点击刷新按钮 🔄 扫描可用串口
3. 在下拉列表中选择目标串口

### 2. 配置串口参数
- **波特率**：选择合适的波特率（最高支持 2M）
- **数据位**：通常为 8
- **停止位**：通常为 1
- **校验位**：通常为"无"

### 3. 打开/关闭串口
- 点击 **"打开串口"** 按钮建立连接
- 点击 **"关闭串口"** 按钮断开连接

### 4. 发送数据
1. 在发送区输入要发送的数据
2. 勾选 **"十六进制发送"** 可切换为 HEX 模式
3. 点击 **"发送数据"** 按钮

### 5. 接收数据
- 数据自动显示在接收区
- 勾选 **"十六进制显示"** 可切换为 HEX 模式
- 勾选 **"自动滚动"** 可自动滚动到最新数据
- 点击 **"清空接收"** 清除接收缓冲区

## 🔧 技术栈详解

### 前端
- **React 18** - UI 框架
- **TypeScript 5** - 类型安全
- **Vite 5** - 构建工具
- **Tailwind CSS 3** - 样式框架

### 后端
- **Tauri 2.0** - 桌面应用框架
- **Rust** - 系统级编程语言
- **serialport crate** - 跨平台串口通信库

### 优势对比
| 特性 | Tauri | Electron |
|------|-------|----------|
| 包体积 | ~5MB | ~100MB+ |
| 内存占用 | ~50MB | ~200MB+ |
| 启动速度 | <1s | 3-5s |
| 安全性 | 高 | 中 |

## ⚠️ 常见问题

### Q: 找不到串口？
A: 
1. 检查设备是否正确连接
2. 检查驱动是否安装正确
3. 尝试以管理员身份运行程序

### Q: 2M 波特率无法使用？
A:
1. 确认串口硬件芯片支持高波特率（如 CH340、CP2102、FT232）
2. 部分 USB 转串口芯片最高只支持 1M 波特率
3. 检查串口线质量，高波特率对信号质量要求高

### Q: 编译失败？
A:
1. 确认已安装 Visual Studio C++ Build Tools
2. 确认 Rust 版本 >= 1.70
3. 尝试运行 `cargo clean` 后重新编译

### Q: Windows 10 运行报错？
A: 安装 WebView2 Runtime：https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/

## 📝 版本历史

### v1.0.0
- ✅ 基础串口通信功能
- ✅ 支持最高 2M 波特率
- ✅ 文本/十六进制收发模式
- ✅ 深色主题界面

## 📄 开源协议

MIT License

---

**开发完成！** 按照本文档即可在 Windows 10 上编译并运行。
