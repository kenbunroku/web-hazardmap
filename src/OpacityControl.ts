/**
 * MIT License
 *
 * Copyright (c) 2021-2025 Yasunori Kirimoto, Kanahiro Iguchi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import "./style.css";

import type { IControl, Map } from "maplibre-gl";

type OpacityControlOptions = {
  baseLayers: Record<string, string>;
  overLayers: Record<string, string>;
  opacityControl: boolean;
};

// デフォルトオプション設定
const defaultOptions: OpacityControlOptions = {
  baseLayers: {},
  overLayers: {},
  opacityControl: false,
};

export class OpacityControl implements IControl {
  #map: Map | undefined;
  #container: HTMLDivElement | undefined;
  #baseLayersOption: Record<string, string>;
  #overLayersOption: Record<string, string>;
  #opacityControlOption: boolean;

  constructor(options: Partial<OpacityControlOptions>) {
    // オプション設定
    this.#baseLayersOption = options.baseLayers ?? defaultOptions.baseLayers;
    this.#overLayersOption = options.overLayers ?? defaultOptions.overLayers;
    this.#opacityControlOption =
      options.opacityControl ?? defaultOptions.opacityControl;
  }

  get container(): HTMLDivElement | undefined {
    return this.#container;
  }

  // ラジオボタン作成
  #radioButtonControlAdd(layerId: string) {
    // 初期レイヤ定義
    const initLayer = Object.keys(this.#baseLayersOption)[0];
    // ラジオボタン追加
    const radioButton = document.createElement("input");
    radioButton.setAttribute("type", "radio");
    radioButton.id = layerId;
    // 初期レイヤのみ表示
    if (layerId === initLayer) {
      radioButton.checked = true;
      this.#map!.setLayoutProperty(layerId, "visibility", "visible");
    } else {
      this.#map!.setLayoutProperty(layerId, "visibility", "none");
    }
    this.#container!.appendChild(radioButton);
    // ラジオボタンイベント
    radioButton.addEventListener("change", (event) => {
      // 選択レイヤ表示
      // @ts-ignore
      event.target.checked = true;
      this.#map!.setLayoutProperty(layerId, "visibility", "visible");
      // 選択レイヤ以外非表示
      Object.keys(this.#baseLayersOption).map((layer) => {
        // @ts-ignore
        if (layer !== event.target.id) {
          // @ts-ignore
          document.getElementById(layer).checked = false;
          this.#map!.setLayoutProperty(layer, "visibility", "none");
        }
      });
    });
    // レイヤ名追加
    const layerName = document.createElement("label");
    layerName.htmlFor = layerId;
    layerName.appendChild(
      document.createTextNode(this.#baseLayersOption[layerId])
    );
    this.#container!.appendChild(layerName);
  }

  // チェックボックス作成
  #checkBoxControlAdd(layerId: string) {
    // チェックボックス追加
    const checkBox = document.createElement("input");
    checkBox.setAttribute("type", "checkbox");
    checkBox.id = layerId;
    // 全レイヤ非表示
    this.#map!.setLayoutProperty(layerId, "visibility", "none");
    this.#container!.appendChild(checkBox);
    // チェックボックスイベント
    checkBox.addEventListener("change", (event) => {
      // レイヤの表示・非表示
      // @ts-ignore
      if (event.target.checked) {
        this.#map!.setLayoutProperty(layerId, "visibility", "visible");
      } else {
        this.#map!.setLayoutProperty(layerId, "visibility", "none");
      }
    });
    // レイヤ名追加
    const layerName = document.createElement("label");
    layerName.htmlFor = layerId;
    layerName.appendChild(
      document.createTextNode(this.#overLayersOption[layerId])
    );
    this.#container!.appendChild(layerName);
  }

  // スライドバー作成
  #rangeControlAdd(layerId: string) {
    // スライドバー追加
    const range = document.createElement("input");
    range.type = "range";
    range.min = String(0);
    range.max = String(100);
    range.value = String(100);
    this.#container!.appendChild(range);
    // スライドバースイベント
    range.addEventListener("input", (event) => {
      // 透過度設定
      this.#map!.setPaintProperty(
        layerId,
        "raster-opacity",
        // @ts-ignore
        Number(event.target.value / 100)
      );
    });
  }

  // コントロール作成
  #opacityControlAdd() {
    // コントロール設定
    this.#container = document.createElement("div");
    this.#container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.#container.id = "opacity-control";
    // 背景レイヤ設定
    if (this.#baseLayersOption) {
      Object.keys(this.#baseLayersOption).map((layer) => {
        const layerId = layer;
        const br = document.createElement("br");
        // ラジオボタン作成
        this.#radioButtonControlAdd(layerId);
        this.#container!.appendChild(br);
      });
    }
    // 区切り線
    if (this.#baseLayersOption && this.#overLayersOption) {
      const hr = document.createElement("hr");
      this.#container.appendChild(hr);
    }
    // オーバーレイヤ設定
    if (this.#overLayersOption) {
      Object.keys(this.#overLayersOption).map((layer) => {
        const layerId = layer;
        const br = document.createElement("br");
        // チェックボックス作成
        this.#checkBoxControlAdd(layerId);
        this.#container!.appendChild(br);
        // スライドバー作成
        if (this.#opacityControlOption) {
          this.#rangeControlAdd(layerId);
          this.#container!.appendChild(br);
        }
      });
    }
  }

  onAdd(map: Map) {
    this.#map = map;
    // コントロール作成
    this.#opacityControlAdd();
    return this.#container!;
  }

  onRemove() {
    this.#container!.parentNode!.removeChild(this.#container!);
    this.#map = undefined;
  }
}

export default OpacityControl;
