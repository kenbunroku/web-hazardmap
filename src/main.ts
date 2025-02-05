import "./style.css";

import maplibre from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";

import { OpacityControl } from "./OpacityControl";

import shelterPointData from "./data/10000_1.json";
import tokyoShelterPointData from "./data/test.json";
import hazardLegendData from "./data/hazard_legend.json";

import * as tilebelt from "@mapbox/tilebelt";
import chroma from "chroma-js";
import turfLength from "@turf/length";
import turfBuffer from "@turf/buffer";
import turfDissolve from "@turf/dissolve";

import { initializeMap } from "./mapConfig";
import { createSearchApi } from "./search";
// import { initializeHazardInfo } from "./hazardInfo";

// 型の読み込み
import type {
  Popup,
  RasterSourceSpecification,
  RasterLayerSpecification,
  GeoJSONSource,
  MapGeoJSONFeature,
} from "maplibre-gl";
import type { FeatureCollection, Position } from "geojson";
import type {
  HazardLegend,
  DistanceGeojson,
  DistanceLine,
  DistancePoint,
} from "./types";

// 距離計測のGeoJSON
const distanceGeojson: DistanceGeojson = {
  type: "FeatureCollection",
  features: [],
};

// 距離計測のライン
const distanceLine: DistanceLine = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [],
  },
  properties: {
    distance: "",
  },
};

const map = initializeMap();

// 検索処理の設定
const geocoderApi = createSearchApi([
  ...shelterPointData.features,
  ...tokyoShelterPointData.features,
]);

// MaplibreGeocoderの追加
map.addControl(
  new MaplibreGeocoder(geocoderApi, {
    maplibregl: maplibre,
    showResultsWhileTyping: true, // 入力中に候補を表示
    marker: true, // マーカーを表示する
    placeholder: "避難所の検索", // プレースホルダー
    reverseGeocode: true, // 逆ジオコーディングを有効にする
  }),
  "top-left" // コントロールの位置
);

let popup: Popup | undefined;
// 表示している災害情報レイヤーのID
let activeHazardId: string | undefined;

// カラーガイドの切り替え
const updatedLegend = (layerId: string) => {
  // 表示している災害情報レイヤーのIDを更新
  activeHazardId = layerId;

  // JSONから凡例ラベルを取得
  const guideColor = hazardLegendData.find(
    (data) => data.id === layerId
  )?.guide_color;
  if (!guideColor) return;

  // カラーガイドを表示する要素を取得
  const legendDiv = document.querySelector("#hazard-legend");
  if (!legendDiv) return;

  // カラーガイドを変更
  legendDiv.innerHTML = guideColor
    .map(
      (item) =>
        `<div class='label' style='background:${item.color};'>${item.label}</div>`
    )
    .join("");

  // ポップアップが表示されてる場合は削除
  popup && popup.remove();
};

map.on("load", () => {
  // const hazardInfo = initializeHazardInfo(map);

  map.addLayer(
    // hillshade レイヤー
    {
      id: "hillshade",
      source: "terrain", // 地形ソースを指定
      type: "hillshade",
      paint: {
        "hillshade-illumination-anchor": "map", // 陰影の光源は地図の北を基準にする
        "hillshade-exaggeration": 0.3, // 陰影の強さ
      },
    },
    "background" // マスクレイヤーの下に追加（対象のレイヤーidを指定する）
  );

  // 背景地図の切り替えコントロール
  const baseMaps = new OpacityControl({
    baseLayers: {
      // コントロールに表示するレイヤーの定義
      pales_layer: "淡色地図",
      seamlessphoto_layer: "空中写真",
      slopemap_layer: "傾斜量図",
    },
  });
  map.addControl(baseMaps, "top-left"); // 第二引数でUIの表示場所を定義

  const hazardLayers = new OpacityControl({
    baseLayers: {
      flood_layer: "洪水浸水想定区域",
      hightide_layer: "高潮浸水想定区域",
      tsunami_layer: "津波浸水想定",
      doseki_layer: "土石流",
      kyukeisha_layer: "急傾斜地",
      jisuberi_layer: "地滑り",
    },
    overLayers: {
      hillshade: "地形",
      building: "3D建物",
    },
  });
  map.addControl(hazardLayers, "top-left");

  map.addControl(new maplibre.NavigationControl({}), "top-right");
  map.addControl(
    new maplibre.TerrainControl({
      source: "terrain",
      exaggeration: 1,
    })
  );

  // 3D切り替え
  const terrainComtrol = document.querySelector(".maplibregl-ctrl-terrain");
  terrainComtrol?.addEventListener("click", () => {
    // 地形が３D表示になっている時は地図を60度傾ける。そうでない時は0度にする。
    map.getTerrain() ? map.easeTo({ pitch: 60 }) : map.easeTo({ pitch: 0 });
  });

  // 凡例表示切り替え
  const hazardControl: HTMLDivElement | undefined = hazardLayers.container;

  hazardControl
    ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    .forEach((radio) => {
      // 初期状態のラジオボタンのチェックを確認
      if (radio.checked) updatedLegend(radio.id);
      // ラジオボタンの変更イベント
      radio.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        // 表示された災害情報レイヤーのIDを取得
        if (target.checked) updatedLegend(target.id);
      });
    });

  map.addControl(
    new maplibre.ScaleControl({
      maxWidth: 200, // スケールの最大幅
      unit: "metric", // 単位
    }),
    "bottom-right"
  );

  map.addControl(
    new maplibre.GeolocateControl({
      trackUserLocation: true,
    }),
    "top-right"
  );
});

// 型定義
type BBOX = [number, number, number, number];
type RGBA = [number, number, number, number];

const getPixelColor = (
  lng: number,
  lat: number,
  bbox: BBOX,
  url: string
): Promise<RGBA> => {
  // クリックした座標がらタイル画像のピクセル座標を計算
  const [lngMin, latMin, lngMax, latMax] = bbox;
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 256;
  const y = ((latMax - lat) / (latMax - latMin)) * 256;

  // タイル画像を読み込み、ピクセル座標の色を返す
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pixel = ctx?.getImageData(x, y, 1, 1).data;
      if (!pixel) return;
      const [r, g, b, a] = [...pixel];
      resolve([r, g, b, a / 255]);
    };
  });
};

// 凡例から最も近いラベルを取得
const getGuide = (
  targetColor: string,
  guideColors: HazardLegend["guide_color"]
) => {
  const closest = guideColors
    .map((item) => {
      // 各色のユークリッド距離を計算
      const distance = chroma.distance(targetColor, item.color);
      return { distance, color: item.color, label: item.label };
    })
    .sort((a, b) => a.distance - b.distance)[0]; // 距離が近い順にソートし、最初の要素を取得
  return { color: closest.color, label: closest.label };
};

// 災害情報レイヤーのクリックイベント
const rasterClick = async (lng: number, lat: number) => {
  // asyncを追加
  // ズームレベルを取得
  const zoom = Math.min(Math.round(map.getZoom()), 17);
  const tile = tilebelt.pointToTile(lng, lat, zoom);
  const bbox = tilebelt.tileToBBOX(tile) as BBOX;

  // クリックしたレイヤーのソースを取得
  const layer = map
    .getStyle()
    .layers.find(
      (layer) => layer.id === activeHazardId
    ) as RasterLayerSpecification;
  const source = map.getSource(layer.source) as RasterSourceSpecification;
  if (!source || !source.tiles) return;

  // 地図タイルのURLを取得
  const url = source.tiles[0]
    .replace("{z}", tile[2].toString())
    .replace("{x}", tile[0].toString())
    .replace("{y}", tile[1].toString());

  // クリックしたタイルの色を取得
  const [r, g, b, a] = await getPixelColor(lng, lat, bbox, url);

  // 透明色の場合は処理を終了
  if (a === 0) return;

  // JSONから表示中の災害情報レイヤーの凡例を取得
  const legend = hazardLegendData.find(
    (data) => data.id === activeHazardId
  ) as HazardLegend;

  // クリックして取得した色から一致する凡例ラベルを取得
  const guide = getGuide(`rgba(${r},${g},${b},${a})`, legend.guide_color);

  // ポップアップを表示
  const html = `<div>${legend.name}</div><h2 style='margin-bottom:0;'>${guide.label}</h2><div style='background:${guide.color}; padding:6px;'></div>`;

  popup = new maplibre.Popup({
    offset: [0, -45],
  })
    .setLngLat([lng, lat])
    .setHTML(html)
    .addTo(map);

  // マーカーを表示
  const marker = new maplibre.Marker().setLngLat([lng, lat]).addTo(map);

  /// ポップアップが閉じられたときにマーカーを削除する;
  popup.on("close", () => {
    if (marker) marker?.remove();
  });
};

map.on("click", (e) => {
  // 距離計測をキャンセルして、geojsonを空にする。
  distanceGeojson.features = [];
  const source = map.getSource("distance") as GeoJSONSource;
  source.setData(distanceGeojson);
  map.getCanvas().style.cursor = "";

  // 避難所の地物を取得
  const features = map.queryRenderedFeatures(e.point, {
    layers: ["shelter_point", "tokyo_shelter_point"], // 両方のレイヤーを対象にする
  });

  if (features.length === 0) {
    // 避難所の地物がない場合は、災害情報レイヤーのクリックイベントを発火
    rasterClick(e.lngLat.lng, e.lngLat.lat);
    return;
  }

  const feature = features[0];
  if (feature.geometry.type !== "Point") return;
  const coordinates = feature.geometry.coordinates as [number, number];

  const prop = feature.properties;
  // レイヤーIDによって表示内容を分岐
  const name =
    feature.layer.id === "tokyo_shelter_point"
      ? prop["避難所_施設名称"]
      : prop["施設・場所名"];
  const address =
    feature.layer.id === "tokyo_shelter_point"
      ? prop["所在地住所"]
      : prop["住所"];

  // バリアフリー情報の取得（東京避難所データの場合のみ）
  let barrierFreeInfo = "なし";
  if (feature.layer.id === "tokyo_shelter_point") {
    const items = [];
    if (prop["エレベーター有/\n避難スペースが１階"] === "○")
      items.push("エレベーター有/避難スペースが１階");
    if (prop["スロープ等"] === "○") items.push("スロープ有");
    if (prop["点字ブロック"] === "○") items.push("点字ブロック有");
    if (prop["車椅子使用者対応トイレ"] === "○")
      items.push("車椅子対応トイレ有");
    if (prop["その他"]) items.push(prop["その他"]);

    if (items.length > 0) {
      barrierFreeInfo = `<ul style="margin: 0; padding-left: 20px;">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>`;
    }
  }

  popup = new maplibre.Popup({
    maxWidth: "300px",
    offset: [0, -15],
  })
    .setLngLat(coordinates)
    .setHTML(
      `
      <h2 style="margin: 4px 0 8px 0;">${name}</h2>
      <div>
        ${address}
        <hr />
        <b>バリアフリー情報</b>
        ${barrierFreeInfo}
      </div>
    `
    )
    .addTo(map);
});

map.on(
  "mouseenter",
  "shelter_point",
  () => (map.getCanvas().style.cursor = "pointer")
);
map.on("mouseleave", "shelter_point", () => {
  map.getCanvas().style.cursor = "";
});

// 右クリックで距離を計測
map.on("contextmenu", (e) => {
  if (!map) return;

  // カーソルのスタイルを変更
  map.getCanvas().style.cursor = "crosshair";

  // 右クリックした点を確認
  const features = map.queryRenderedFeatures(e.point, {
    layers: ["distance-points"],
  });

  // ラインストリングを削除
  if (distanceGeojson.features.length > 1) distanceGeojson.features.pop();
  if (features.length) {
    // ポイントをクリックした場合はそのポイントを削除
    const id = features[0].properties.id;
    const points = distanceGeojson.features.filter(
      (point) => point.geometry.type === "Point"
    ) as DistancePoint[];
    distanceGeojson.features = points.filter(
      (point) => point.properties.id !== id
    );
  } else {
    // ポイントをクリックしていない場合は新しいポイントを追加
    const point: DistancePoint = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [e.lngLat.lng, e.lngLat.lat],
      },
      properties: {
        id: crypto.randomUUID(),
        distance: "",
      },
    };
    distanceGeojson.features.push(point);
  }
  if (distanceGeojson.features.length > 1) {
    if (!distanceGeojson) return;
    // 点が2つ以上ある場合はラインを生成
    distanceLine.geometry.coordinates = distanceGeojson.features.map(
      (feature, i, features) => {
        if (i === 0) feature.properties.distance = "";
        else {
          // 前のポイントから現在のポイントまでの距離計算用のラインを生成
          const segment = {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: features
                .slice(0, i + 1)
                .map((feat) => feat.geometry.coordinates),
            },
          };
          // セグメントの長さを計算し、各ポイントのpropertiesに追加
          const length = turfLength(segment, { units: "kilometers" }).toFixed(
            2
          );
          feature.properties.distance = `${length}km`;
        }
        return feature.geometry.coordinates;
      }
    ) as Position[];

    // ラインストリングを追加
    distanceGeojson.features.push(distanceLine);
  }
  // 距離計測のラインを更新
  const source = map.getSource("distance") as GeoJSONSource;
  source.setData(distanceGeojson);
});

// マウスカーソルのスタイルを変更
map.on(
  "mouseenter",
  "distance-points",
  () => (map.getCanvas().style.cursor = "pointer")
);
map.on(
  "mouseleave",
  "distance-points",
  () => (map.getCanvas().style.cursor = "crosshair")
);

// 到達圏の生成
const setBuffer = (val: number) => {
  const bufferPolygon: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  const source = map.getSource("buffer") as GeoJSONSource;
  if (val === 0) {
    // スライダーの値が0のときは、空のポリゴンをセットする
    source.setData(bufferPolygon);
    return;
  }
  const features = map.querySourceFeatures("shelter");
  if (!features.length) return;

  // 円形のポリゴンの生成
  features.forEach((point: MapGeoJSONFeature) => {
    const buffer = turfBuffer(point, val / 1000, { units: "kilometers" });
    bufferPolygon.features.push(buffer);
  });

  // 到達圏を描画
  source.setData(bufferPolygon);

  // 到達圏のポリゴンを結合
  const dissolveBuffer = turfDissolve(bufferPolygon);

  // 到達圏を描画
  source.setData(dissolveBuffer);
};

// 到達圏レイヤーUIの取得
const bufferControl = document.getElementById(
  "shelter-control"
) as HTMLDivElement;
const range = bufferControl.querySelector(
  "input[type='range']"
) as HTMLInputElement;

// スライダーの値が変更されたときにテキストを書き換え
range.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement;
  const text = bufferControl.querySelector("label") as HTMLLabelElement;
  text.textContent = `避難所の到達圏 ${target.value} m`;
});

// スライダーの値が変更されたときに、到達圏のポリゴンを描画
range.addEventListener("change", () => {
  if (map.getZoom() < 13) return;
  // 到達圏の描画
  setBuffer(Number(range.value));
});

// マップを動かすたびに発火
map.on("moveend", () => {
  if (map.getZoom() < 13) {
    // ズームレベルが13未満の場合は到達圏のUIを非表示
    bufferControl.style.display = "none";
  } else {
    // ズームレベルが13以上の場合は到達圏のUIを表示
    bufferControl.style.display = "flex";

    // 到達圏を描画
    setBuffer(Number(range.value));
  }
});
