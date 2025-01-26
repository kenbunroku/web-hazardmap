import Fuse from "fuse.js";
import moji from "moji";
import type { ShelterPointfeature } from "./types";
import type { IFuseOptions } from "fuse.js";

export const encode = (text: string) => {
  return moji(text)
    .convert("HK", "ZK")
    .convert("ZS", "HS")
    .convert("ZE", "HE")
    .convert("HG", "KK")
    .toString()
    .replace(/\s+/g, "")
    .toLowerCase();
};

export const createSearchApi = (shelterPointData: any) => {
  const fuseOptions: IFuseOptions<ShelterPointfeature> = {
    threshold: 0.3, // あいまい検索のしきい値
    keys: ["properties.施設・場所名", "properties.住所"], // 検索対象のプロパティ（ドット記法）
    getFn: (obj: ShelterPointfeature, path: string | string[]) => {
      // pathが文字列の場合、配列に変換
      const pathArray = Array.isArray(path) ? path : [path];

      // パスに従ってオブジェクトから値を取得（型安全性を保つためにプロパティを直接アクセス）
      const value = obj.properties[
        pathArray[1] as keyof typeof obj.properties
      ] as string;

      // encode処理を実行
      return encode(value);
    },
  };

  const fuse = new Fuse(
    shelterPointData.features as ShelterPointfeature[],
    fuseOptions
  );

  return {
    forwardGeocode: async (config: any) => {
      // 検索ワードを取得
      const searchWord = encode(config.query);

      // 検索ワードから部分一致する避難所のデータを取得
      const matchingFeatures = fuse
        .search(searchWord)
        .map((result) => result.item);

      // 一致する避難所のデータを返す
      const features = matchingFeatures.map(
        ({ geometry: { coordinates: center }, properties }) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: center,
          },
          place_name: `${properties["施設・場所名"]},${properties["住所"]}`,
          center,
        })
      );

      return {
        features,
      };
    },

    // 逆ジオコーディング処理を実行
    reverseGeocode: async (config: any) => {
      // 緯度経度からポイントを生成する関数
      const coordinateFeature = (lng: number, lat: number) => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          place_name: "緯度: " + lat + " 経度: " + lng,
          center: [lng, lat],
        };
      };

      const firstCoord = config.query[0]; // 1番目の座標
      const secondCoord = config.query[1]; // 2番目の座標
      const features = [];

      // 座標の順序を確認
      if (firstCoord < -90 || firstCoord > 90) {
        // 緯度、経度の順番であると推定
        features.push(coordinateFeature(firstCoord, secondCoord));
      }
      if (secondCoord < -90 || secondCoord > 90) {
        // 経度、緯度の順番であると推定
        features.push(coordinateFeature(secondCoord, firstCoord));
      }
      if (features.length === 0) {
        // いずれの順序でも可能である座標は両方を追加
        features.push(coordinateFeature(firstCoord, secondCoord));
        features.push(coordinateFeature(secondCoord, firstCoord));
      }

      return Promise.resolve({
        features, // 生成したポイントを返す
      });
    },
  };
};
