export interface AreaLocation {
  id: string;
  code: string;
  name: string;
  sort_order: number;
}

export interface AreaAsset {
  id: string;
  location_id: string | null;
}

export function summarizeAreaProgress(
  locations: AreaLocation[],
  assets: AreaAsset[],
  completedAssetIds: ReadonlySet<string>,
) {
  return locations.map((location) => {
    const areaAssets = assets.filter((asset) => asset.location_id === location.id);
    const completed = areaAssets.filter((asset) => completedAssetIds.has(asset.id)).length;
    return {
      ...location,
      deviceCount: areaAssets.length,
      completed,
      total: areaAssets.length,
    };
  });
}
