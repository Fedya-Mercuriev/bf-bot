/* eslint-disable indent */

const { processResponse } = require('../../order/validate/validate-shipping/chunks/process-shipping-info');
const errorLocationResponse = require('./responses/errorLocationResponse.json');
const errorAddressResponse = require('./responses/errorAddressResponse.json');
const addressResponse = require('./responses/addressResponse.json');
const locationResponse = require('./responses/locationResponse.json');

describe('Testing shipping validation', () => {
    test.each([
            errorAddressResponse,
            errorLocationResponse,
        ])
        ('Throws an error if given an error response object (no precise locations)', (responseObj) => {
            return processResponse(responseObj, 'Томск')
                .catch((e) => {
                    expect(e.message).toMatch('мне не удалось ничего найти по введенному вами адресу');
                });
        })

    test.each([
            addressResponse,
            locationResponse,
        ])
        ('Returns an array if given response object contains precise addresses and mathces shipping city', (responseObj) => {
            const { response: { GeoObjectCollection: { metaDataProperty: { GeocoderResponseMetaData: { found: expectedLength } } } } } = responseObj;
            return processResponse(responseObj, 'Томск')
                .then((result) => {
                    expect(typeof result).toBe('object');
                });
        });
});