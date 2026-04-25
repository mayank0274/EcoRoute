import { TomTomService } from "./tomTom.service.ts";
import type { IMapService } from "./mapService.interface.ts";

export const mapService: IMapService = new TomTomService();
