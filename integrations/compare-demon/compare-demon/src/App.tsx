import { MindDemonGame } from "./MindDemonGame";

// 竖屏手机容器：移动端全屏，桌面居中成手机条（样式见 styles.css）
export function App() {
  return (
    <div className="phone-frame">
      <MindDemonGame />
    </div>
  );
}
