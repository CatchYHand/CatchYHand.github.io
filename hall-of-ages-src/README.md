# 群星议会 The Hall of Ages · 源码

本游戏基于 [无名杀 noname](https://github.com/libnoname/noname)（GPL-3.0）修改而成，修改部分同样按 GPL-3.0 发布。

## 如何得到完整源码

1. 克隆无名杀：`git clone https://github.com/libnoname/noname.git`
2. 切到本游戏基于的版本：`git checkout c73270948d72949aa80009536b9fd5400767d091`
3. 打上本目录的补丁：`git apply hall-of-ages.patch`
4. 构建：`pnpm install && pnpm build`

补丁包含全部代码改动：40 位武将与技能（`apps/core/character/qunxing/`）、卡牌效果调整、界面换皮、静态托管适配。

## 美术

武将立绘、卡牌、身份牌、牌背、座位框、徽章等美术 © Yuanhao Chen，保留所有权利，不在 GPL 授权范围内。
