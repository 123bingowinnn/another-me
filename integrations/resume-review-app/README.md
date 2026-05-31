# Resume Review App

简历诊断室，一个面向刚毕业大学生的简历识别与优化建议小应用。

## 文件

- components/ResumeReviewApp.tsx：可复用简历诊断组件
- app/tools/resume-review/page.tsx：Next App Router 独立页面入口

## 接入方式

把压缩包内的 app/ 和 components/ 合并到你的 Next 项目里，然后访问：

```txt
/tools/resume-review
```

如果要嵌入到现有页面：

```tsx
import { ResumeReviewApp } from "@/components/ResumeReviewApp";

<ResumeReviewApp framed={false} />
```

## 当前能力

- 支持上传 PDF、PNG、JPG、WebP 简历
- 提供图片/PDF 预览
- 对上传文件做大小、清晰度、方向比例、明暗对比等预检
- 预留 recognizeResumeFromFile(file) 接入口，后续可替换为 OCR / 大模型 API
- 识别文本返回后，本地分析结构、量化证据、岗位关键词、表达风险
- 输出能力雷达图、短板排序、优先修改建议、保留优势和今晚可执行的修改清单

## 独立性

这个应用只包含 ResumeReviewApp 和 /tools/resume-review 页面，不依赖 /games/offer-rescue 或 OfferRescueGame。

## 备注

当前包不新增 npm 依赖；真实 PDF/图片文字识别需要后续接后端 OCR 或大模型 API。
