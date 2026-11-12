---
name: 张慧个人网站
description: 以一根逐渐理开的蓝线讲述产品工作方法与真实项目。
colors:
  paper: "#f4f3ef"
  white: "#fff"
  ink: "#202b33"
  muted: "#58636b"
  thread-blue: "#325bd6"
  blue-hover: "#2349b6"
  divider: "#d2d7d5"
  selection: "#e9edb5"
typography:
  display:
    fontFamily: "PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "clamp(42px, 4.5vw, 60px)"
    fontWeight: 700
    lineHeight: 1.42
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "clamp(31px, 3.6vw, 47px)"
    fontWeight: 700
    lineHeight: 1.42
  case-title:
    fontFamily: "PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "clamp(29px, 3.4vw, 44px)"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "4px"
spacing:
  mobile-gutter: "20px"
  narrow-gutter: "16px"
  desktop-gutter: "40px"
components:
  link-primary:
    backgroundColor: "{colors.thread-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "9px 22px"
    height: "48px"
  link-primary-hover:
    backgroundColor: "{colors.blue-hover}"
    textColor: "{colors.white}"
  link-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 22px"
    height: "48px"
  route-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
    height: "44px"
  route-option-selected:
    backgroundColor: "{colors.thread-blue}"
    textColor: "{colors.white}"
---

# Design System: 张慧个人网站

## Overview

**Creative North Star: “抽丝剥茧 · 业务手记”**

纸白像工作纸，墨色承载判断，蓝线呈现把复杂业务逐步理清的过程。首页的同一根 Canvas 线随正常滚动从非对称线团逐段展开，四种方法依次出现，最后分支连接两个职业项目及后置的 GrooveLog 个人项目。详页转为安静的阅读排版；线与节点仍作为内容线索。

**Key Characteristics:**
- 大面积纸白留白、原生中文无衬线字和少量线蓝。
- 首页侧方文字与连续线团同台；手机图形在上、文字在下。
- 真实案例分层阅读，项目阶段、职责和成果按事实呈现。

## Colors

### Primary
- **解线蓝**：仅用于主线、连接节点、可操作文字、选中状态与可见焦点；悬停时加深。

### Neutral
- **纸白**：全站底色，也是 Canvas 遮挡线段时的底色。
- **深墨**：标题与主要正文。
- **灰墨**：说明、状态、项目引题和次级信息。
- **细线灰**：导航及详页内容分隔。
- **白**：详情页局部阅读容器及主操作文字。
- **浅黄绿**：文本选择状态。

**The One Thread Rule.** 蓝色首先表达同一条问题线和可行动路径；不要把它扩展为大面积装饰底色。

## Typography

**Display Font:** PingFang SC，回退 Microsoft YaHei、system-ui、sans-serif。
**Body Font:** 同一中文原生无衬线字体栈。

字级依靠字号和字重建立层次，不借装饰字体表达科技感。首页首句为最大一级；四段方法略小；项目详情标题、正文和小标签形成稳定阅读节奏。详情正文行距较松，主要段落限制在约 72ch 内。

**The Short Method Rule.** 首页每一方法只用一句判断和一条具体做法；解释与事实进入案例详情。

## Layout

内容最大宽度为 1160px。桌面页面左右留 40px，1020px 以下为 28px，760px 以下为 20px，360px 以下为 16px。页头桌面高 82px、手机高 70px，保持固定可达。

增强模式首页采用 510svh 的滚动行程及粘性舞台；桌面文字位于左侧、Canvas 位于右侧，终点项目分支在右侧依次落位。手机改为图形在上、文字在下，项目入口纵向排列；低矮窄视口另有紧凑布局。滚动可正反控制进度，“看项目”和逐步按钮可直接到达目标。

静态模式中，四种方法和三个项目按文档顺序自然流排版；减少动态效果及无脚本时仍能阅读和访问案例。详情页以窄正文、横向成果区、沿左侧细线排列的章节构成；手机成果区改为单列。

## Elevation & Depth

界面整体平面化，没有卡片投影。层次通过纸白与局部白底、细线分隔、留白、字号和蓝线交叠建立。Canvas 交叉处以纸白遮挡表现线段前后关系，不使用发光或浮起的科技球。

## Shapes

页面边缘和阅读区保持直线；可点控件使用轻微圆角（4px）。线的端点、方法节点和分支节点为小圆点，线条曲率自然且不规则。项目入口是文字加线的连接点，而非等宽卡片。

## Components

### Navigation

固定纸白页头：左侧姓名与身份，中间项目／联系，右侧蓝色下载简历。底部用细灰线分隔。手机维持可见的下载入口；链接至少 44px 高。键盘焦点以 2px 蓝色描边、5px 外偏移标示。

### Links and Buttons

主操作为蓝底白字、48px 最小高度的轻圆角链接；次操作为透明底、细边框。首页“拉开这根线”是蓝色下划线文本按钮；悬停加深，禁用状态转灰。详情页的返回和联系沿用同一套语义。

### Thread Story

首页 Canvas 绘制单根连续蓝线，线宽约 2.6px；线头、已完成方法标记和终点分支随滚动位置更新。当前方法淡入，过去的方法作为线旁标记留下。终点三条项目链接按职业项目在前、个人项目在后排列。减少动态效果时停用过渡并走静态阅读。

### Case Sections

案例页先给标题、问题、阶段／职责，再用细线分隔成果。正文各层由竖线和蓝色节点串联，段落不超过约 72ch；实施细节通过原生 `details` 展开。服务分流示意的选项使用同一轻圆角控件，选中时蓝底白字，并同步更新结果文字。

## Do's and Don'ts

### Do:
- **Do** 保持一根连续线的身份，让方法出现与局部解线同步。
- **Do** 让滚动、键盘、减少动态效果和无脚本读者都能到达项目与联系方式。
- **Do** 在案例详情标清项目阶段、职责、数据口径及流程示意性质。

### Don't:
- **Don't** 把首页改成履历列表、能力卡网格或独立的选择对话。
- **Don't** 让蓝线穿过正文或项目文字，或把解线图当作真实业务指标图。
- **Don't** 为职业项目补造公开 Demo、客户原话、逐轮准确率曲线或未确认的事实。
