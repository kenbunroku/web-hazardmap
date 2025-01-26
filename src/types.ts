import type { Point, LineString } from "geojson";

export type HazardLegend = {
  id: string;
  name: string;
  guide_color: {
    color: string;
    label: string;
  }[];
};

export type DistanceLine = {
  type: "Feature";
  properties: {
    distance: string;
  };
  geometry: LineString;
};

export type DistancePoint = {
  type: "Feature";
  geometry: Point;
  properties: {
    id: string;
    distance: string;
  };
};

export type DistanceGeojson = {
  type: "FeatureCollection";
  features: (DistanceLine | DistancePoint)[];
};

export type ShelterPointfeature = {
  type: "Feature";
  properties: {
    NO: string;
    共通ID: string;
    "施設・場所名": string;
    住所: string;
    指定緊急避難場所との住所同一: string;
    その他市町村長が必要と認める事項: string | null;
    受入対象者: string | null;
    備考: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};
