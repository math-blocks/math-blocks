import * as React from "react";
import {Provider} from "react-redux";

import {comicSans, FontMetricsContext} from "@math-blocks/metrics";

import {store} from "./store";
import Tutor from "./tutor";

console.log(store);
console.log(store.getState());

const TutorPage: React.FunctionComponent = () => {
    return (
        <Provider store={store}>
            <FontMetricsContext.Provider value={comicSans}>
                <Tutor />
            </FontMetricsContext.Provider>
        </Provider>
    );
};

export default TutorPage;
