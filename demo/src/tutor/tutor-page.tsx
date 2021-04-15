import * as React from "react";
import {Provider} from "react-redux";

import {FontDataContext} from "@math-blocks/react";
import {getFontData, parse} from "@math-blocks/opentype";
import type {Font} from "@math-blocks/opentype";

import {store} from "./store";
import Tutor from "./tutor";

console.log(store);
console.log(store.getState());

const TutorPage: React.FunctionComponent = () => {
    const [font, setFont] = React.useState<Font | null>(null);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/STIX2Math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setFont(font);
        };

        loadFont();
    }, []);

    if (!font) {
        return null;
    }

    const fontData = getFontData(font, "STIX2");

    return (
        <Provider store={store}>
            <FontDataContext.Provider value={fontData}>
                <Tutor />
            </FontDataContext.Provider>
        </Provider>
    );
};

export default TutorPage;
