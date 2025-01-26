import maplibre, {
  Map,
  Popup,
  RasterSourceSpecification,
  RasterLayerSpecification,
} from "maplibre-gl";
import * as tilebelt from "@mapbox/tilebelt";
import chroma from "chroma-js";
import type { HazardLegend } from "./types";
import hazardLegendData from "./data/hazard_legend.json";

type BBOX = [number, number, number, number];
type RGBA = [number, number, number, number];

export class HazardInfoManager {
  private map: Map;
  private popup?: Popup;
  private activeHazardId?: string;

  constructor(map: Map) {
    this.map = map;
  }

  private getPixelColor = async (
    lng: number,
    lat: number,
    bbox: BBOX,
    url: string
  ): Promise<RGBA> => {
    const [lngMin, latMin, lngMax, latMax] = bbox;
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 256;
    const y = ((latMax - lat) / (latMax - latMin)) * 256;

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

  private getGuide = (
    targetColor: string,
    guideColors: HazardLegend["guide_color"]
  ) => {
    const closest = guideColors
      .map((item) => {
        const distance = chroma.distance(targetColor, item.color);
        return { distance, color: item.color, label: item.label };
      })
      .sort((a, b) => a.distance - b.distance)[0];
    return { color: closest.color, label: closest.label };
  };

  public updateLegend = (layerId: string) => {
    this.activeHazardId = layerId;

    const guideColor = hazardLegendData.find(
      (data) => data.id === layerId
    )?.guide_color;
    if (!guideColor) return;

    const legendDiv = document.querySelector("#hazard-legend");
    if (!legendDiv) return;

    legendDiv.innerHTML = guideColor
      .map(
        (item) =>
          `<div class='label' style='background:${item.color};'>${item.label}</div>`
      )
      .join("");

    this.popup?.remove();
  };

  public handleRasterClick = async (lng: number, lat: number) => {
    const zoom = Math.min(Math.round(this.map.getZoom()), 17);
    const tile = tilebelt.pointToTile(lng, lat, zoom);
    const bbox = tilebelt.tileToBBOX(tile) as BBOX;

    const layer = this.map
      .getStyle()
      .layers.find(
        (layer) => layer.id === this.activeHazardId
      ) as RasterLayerSpecification;
    const source = this.map.getSource(
      layer.source
    ) as RasterSourceSpecification;
    if (!source || !source.tiles) return;

    const url = source.tiles[0]
      .replace("{z}", tile[2].toString())
      .replace("{x}", tile[0].toString())
      .replace("{y}", tile[1].toString());

    const [r, g, b, a] = await this.getPixelColor(lng, lat, bbox, url);
    if (a === 0) return;

    const legend = hazardLegendData.find(
      (data) => data.id === this.activeHazardId
    ) as HazardLegend;

    const guide = this.getGuide(
      `rgba(${r},${g},${b},${a})`,
      legend.guide_color
    );

    const html = `<div>${legend.name}</div><h2 style='margin-bottom:0;'>${guide.label}</h2><div style='background:${guide.color}; padding:6px;'></div>`;

    const marker = new maplibre.Marker().setLngLat([lng, lat]).addTo(this.map);

    this.popup = new maplibre.Popup({
      offset: [0, -45],
    })
      .setLngLat([lng, lat])
      .setHTML(html)
      .addTo(this.map);

    this.popup.on("close", () => {
      marker?.remove();
    });
  };
}

export const initializeHazardInfo = (map: Map) => {
  return new HazardInfoManager(map);
};
