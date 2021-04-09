import * as React from "react";
import {Provider} from "react-redux";

import {FontDataContext} from "@math-blocks/react";

import {comicSans} from "@math-blocks/opentype";
import {store} from "./store";
import Tutor from "./tutor";

console.log(store);
console.log(store.getState());

const TutorPage: React.FunctionComponent = () => {
    const fontData = {
        fontMetrics: comicSans,
        fontFamily: "comic sans ms",
    };

    return (
        <Provider store={store}>
            <FontDataContext.Provider value={fontData}>
                <Tutor />
            </FontDataContext.Provider>
        </Provider>
    );
};

export default TutorPage;
