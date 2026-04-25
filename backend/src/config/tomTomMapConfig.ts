import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { envConfig } from '../envConfig.ts';

export const initializeTomTom = () => {
    TomTomConfig.instance.put({
        apiKey: envConfig.TOMTOM_API_KEY
    });
};
