import { makeAutoObservable } from "mobx";

class GlobalStore {
	curTab = window.location.hash.replace("#", "") || "/";

	constructor() {
		makeAutoObservable(this);
	}

	setCurTab = (tab: string) => {
		this.curTab = tab;
	}
}

export default GlobalStore;
