import maplibre from "maplibre-gl";
import { useGsiTerrainSource } from "maplibre-gl-gsi-terrain";

import gunmaPointData from "./data/gunma.json";
import chibaPointData from "./data/chiba.json";
import kanagawaPointData from "./data/kanagawa.json";
import saitamaPointData from "./data/saitama.json";
import tokyoShelterPointData from "./data/tokyo.json";

import type { DistanceGeojson } from "./types";
import { FeatureCollection } from "geojson";

const shelterPointData: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    ...(gunmaPointData as FeatureCollection).features,
    ...(chibaPointData as FeatureCollection).features,
    ...(kanagawaPointData as FeatureCollection).features,
    ...(saitamaPointData as FeatureCollection).features,
  ],
};

const gsiTerrainSource = useGsiTerrainSource(maplibre.addProtocol);

// 距離計測のGeoJSON
const distanceGeojson: DistanceGeojson = {
  type: "FeatureCollection",
  features: [],
};

export const mapConfig: maplibre.MapOptions = {
  container: "map",
  style: {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      terrain: gsiTerrainSource,
      pales: {
        // ソースの定義
        type: "raster", // データタイプはラスターを指定
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"], // タイルのURL
        tileSize: 256, // タイルのサイズ
        maxzoom: 18, // 最大ズームレベル
        attribution:
          "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>", // 地図上に表示される属性テキスト
      },
      seamlessphoto: {
        // シームレス写真
        type: "raster",
        tiles: [
          "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
        ],
        tileSize: 256,
        attribution:
          "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
        maxzoom: 18,
      },
      slopemap: {
        // 傾斜量図
        type: "raster",
        tiles: [
          "https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
        maxzoom: 15,
      },
      flood: {
        // 洪水浸水想定区域（想定最大規模）
        type: "raster",
        tiles: [
          "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution:
          "<a href='https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html' target='_blank'>ハザードマップポータルサイト</a>",
      },
      hightide: {
        // 高潮浸水想定区域
        type: "raster",
        tiles: [
          "https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png",
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution:
          "<a href='https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html' target='_blank'>ハザードマップポータルサイト</a>",
      },
      tsunami: {
        // 津波浸水想定
        type: "raster",
        tiles: [
          "https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png",
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution:
          "<a href='https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html' target='_blank'>ハザードマップポータルサイト</a>",
      },
      doseki: {
        // 土砂災害警戒区域（土石流）
        type: "raster",
        tiles: [
          "https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png",
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution:
          '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>',
      },
      kyukeisha: {
        // 土砂災害警戒区域（急傾斜地の崩壊）
        type: "raster",
        tiles: [
          "https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png",
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution:
          '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>',
      },
      jisuberi: {
        // 土砂災害警戒区域（地すべり）
        type: "raster",
        tiles: [
          "https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png",
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution:
          '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>',
      },
      shelter: {
        type: "geojson", // データタイプはgeojsonを指定
        data: shelterPointData as FeatureCollection,
        attribution:
          '<a href="https://www.bousai.metro.tokyo.lg.jp/bousai/1000026/1000316.html" target="_blank">東京都避難所、避難場所データ オープンデータ</a>',
        cluster: true, // クラスタリングの有効化
        clusterMaxZoom: 12, // クラスタリングを開始するズームレベル
        clusterRadius: 50, // クラスタリングの半径
      },
      tokyo_shelter: {
        type: "geojson",
        data: tokyoShelterPointData as FeatureCollection,
        attribution:
          '<a href="https://www.bousai.metro.tokyo.lg.jp/bousai/1000026/1000316.html" target="_blank">東京都避難所、避難場所データ オープンデータ</a>',
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      },
      gsi_vector: {
        // 地理院ベクトル
        type: "vector",
        tiles: [
          "https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf",
        ],
        maxzoom: 16,
        minzoom: 4,
        attribution:
          "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
      },
      distance: {
        type: "geojson",
        data: distanceGeojson,
      },
      buffer: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    },
    layers: [
      {
        id: "pales_layer", // レイヤーのID
        source: "pales", // ソースのID
        type: "raster", // データタイプはラスターを指定
      },
      {
        id: "seamlessphoto_layer",
        source: "seamlessphoto",
        type: "raster",
        layout: { visibility: "none" },
      },
      {
        id: "slopemap_layer",
        source: "slopemap",
        type: "raster",
        layout: { visibility: "none" },
      },
      {
        id: "background", // マスクレイヤー
        type: "background",
        paint: {
          "background-color": "#000", // レイヤーの色を設定
          "background-opacity": 0, // 不透明度を設定
        },
      },
      {
        id: "flood_layer", // 洪水浸水想定区域（想定最大規模）
        source: "flood",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        id: "hightide_layer", // 高潮浸水想定区域
        source: "hightide",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        id: "tsunami_layer", // 津波浸水想定
        source: "tsunami",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        // 土砂災害警戒区域（土石流）
        id: "doseki_layer",
        source: "doseki",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        // 土砂災害警戒区域（急傾斜地の崩壊
        id: "kyukeisha_layer",
        source: "kyukeisha",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        // 土砂災害警戒区域（地すべり）
        id: "jisuberi_layer",
        source: "jisuberi",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
        layout: { visibility: "none" },
      },
      {
        id: "clusters", // クラスター
        source: "shelter",
        type: "circle",
        filter: ["has", "point_count"], // クラスターに含まれるポイントのみ表示
        paint: {
          "circle-color": "#0BB1AF", // クラスターの色
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            750,
            40,
          ], // クラスターのポイント数に応じてサイズを変更
          "circle-blur": 0.3, // クラスターのぼかし
        },
      },
      {
        id: "cluster-count", // クラスターのポイントの数
        source: "shelter",
        type: "symbol",
        filter: ["has", "point_count"], // クラスターに含まれるポイントのみ表示
        layout: {
          "text-field": "{point_count_abbreviated}", // クラスターのポイント数を表示
          "text-size": 12, // テキストのサイズ
        },
        paint: {
          "text-color": "#fff",
        },
      },
      {
        // 到達圏レイヤー
        id: "shelter_buffer",
        source: "buffer",
        type: "fill",
        minzoom: 13,
        paint: {
          "fill-color": "#0BB1AF",
          "fill-opacity": 0.5,
          "fill-outline-color": "#000",
        },
      },
      {
        id: "shelter_point",
        source: "shelter",
        type: "circle", // ポイントデータを表示するためにcircleを指定
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0BB1AF", // ポイントの色
          "circle-radius": 8, // ポイントのサイズ
          "circle-stroke-width": 2, // ポイントの枠線の太さ
          "circle-stroke-color": "#fff", // ポイントの枠線の色
        },
      },
      {
        id: "tokyo_shelter_clusters",
        source: "tokyo_shelter",
        type: "circle",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0BB1AF",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            100,
            30,
            750,
            40,
          ],
          "circle-blur": 0.3,
        },
      },
      {
        id: "tokyo_shelter_count",
        source: "tokyo_shelter",
        type: "symbol",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: {
          "text-color": "#fff",
        },
      },
      {
        id: "tokyo_shelter_point",
        source: "tokyo_shelter",
        type: "circle",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0BB1AF",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      },
      {
        id: "building", // 建物レイヤー
        source: "gsi_vector",
        "source-layer": "building", // buildingを指定して建物のみ表示
        type: "fill-extrusion", // fill-extrusionで立体表示
        minzoom: 13,
        maxzoom: 18,
        paint: {
          "fill-extrusion-color": "#BEE6FF", // 色を指定
          "fill-extrusion-height": [
            "match", // 建物の種類によって高さを変える
            ["get", "ftCode"], // ftCodeで建物の種類を区別する
            3101,
            10, // 普通建物
            3102,
            40, // 堅ろう建物
            3103,
            100, // 高層建物
            3111,
            10, // 普通無壁舎
            3112,
            40, // 堅ろう無壁舎
            10, // その他
          ],
          "fill-extrusion-opacity": 0.6, // 不透明度を指定
        },
      },
      {
        id: "distance-lines",
        type: "line",
        source: "distance",
        layout: {
          "line-cap": "round", // ラインの先端を丸く
          "line-join": "round", // ラインの接合点を丸く
        },
        paint: {
          "line-color": "#000",
          "line-width": 3, // ラインの太さ
          "line-dasharray": [0.2, 2], // 点線表示
        },
        filter: ["in", "$type", "LineString"], // ラインのみ
      },
      // 距離計測のポイント
      {
        id: "distance-points",
        type: "circle",
        source: "distance",
        paint: {
          "circle-radius": 6,
          "circle-color": "#000",
        },
        filter: ["in", "$type", "Point"], // ポイントのみ
      },
      // 距離計測のラベル
      {
        id: "distance-label",
        source: "distance",
        type: "symbol",
        paint: {
          "text-color": "#000",
          "text-halo-color": "#FFF",
          "text-halo-width": 2,
        },
        layout: {
          "text-offset": [0, -1], // ラベルの位置
          "text-size": 14, // ラベルのサイズ
          "text-field": ["get", "distance"], // distanceプロパティの値を表示
        },
        filter: ["in", "$type", "Point"], // ポイントのみ
      },
    ],
  },
  center: [138.6376, 36.5524],
  zoom: 12,
  minZoom: 8,
  maxZoom: 17.99,
};

export const initializeMap = () => {
  const map = new maplibre.Map(mapConfig);
  // tokyo_shelter_pointレイヤーのマウスイベント
  map.on(
    "mouseenter",
    "tokyo_shelter_point",
    () => (map.getCanvas().style.cursor = "pointer")
  );
  map.on("mouseleave", "tokyo_shelter_point", () => {
    map.getCanvas().style.cursor = "";
  });
  return map;
};
