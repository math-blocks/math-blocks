import * as React from "react";
import {Provider} from "react-redux";

import {store} from "./store";
import Tutor from "./tutor";

console.log(store);
console.log(store.getState());

const TutorPage: React.FunctionComponent = () => {
    return (
        <Provider store={store}>
            <Tutor />
        </Provider>
    );
};

export default TutorPage;
