export const TREE_LOAD = 'TREE_LOAD';
export const CREATE_FILE = 'CREATE_FILE';
export const FILE_OPENED = 'FILE_OPENED';
export const CLOSE_ALL_FILES = 'CLOSE_ALL_FILES';
export const DRAG_AND_DROP = 'DRAG_AND_DROP';
export const DRAG_AND_DROP_BEGIN = 'DRAG_AND_DROP_BEGIN';
export const UPDATE_PROJECT = 'UPDATE_PROJECT';
export const CLEAR_CURRENT_PROJECT = 'CLEAR_CURRENT_PROJECT';
export const CONTENT_TREE_LOAD = 'CONTENT_TREE_LOAD';

import { FilesService } from '../services/filesService';
import { CheckChangesService } from '../services/checkChangesService';

export function loadTree(tree) {
	return {
		type: TREE_LOAD,
		payload: {
			tree: tree
		}
	};
}

export function createFile(file) {
	return (dispatch, getStore) => {
		let store = getStore();
		let files = store.projectWindow.openedFiles;
		if (!file.name)
			file.name = file.path.substring(file.path.lastIndexOf("/") + 1);
		if (!file.docsPath) {
			file.docsPath = file.path.substring(0, file.path.indexOf(store.projectWindow.tree.name) + store.projectWindow.tree.name.length) + "/.codedoc" + file.path.substring(file.path.indexOf(store.projectWindow.tree.name) + store.projectWindow.tree.name.length) + "/" + file.name + ".md";
		}
		var dir = file.docsPath.slice(0, (-file.name.length) - 4);
		FilesService.createToPathDir(dir, store.projectWindow.tree.name, function(err, res) {
			console.log(err);
			console.log(res);
		});
		FilesService.createFile(file.docsPath, () => {
			dispatch({
				type: 'LOAD_FILE',
				text: '',
				link: file.docsPath
			});
			file.tabKey = files.length;
			files.push(file);
			dispatch({
				type: FILE_OPENED,
				payload: {
					openedFiles: files,
					activeFile: file
				}
			});
		});

		FilesService.ContentFileToConfig(store.projectWindow.tree.path, file, "ADD", (newFile) => {
			let contentTree = store.projectWindow.contentTree.tree;
			contentTree.push(newFile);
			dispatch({
				type: CONTENT_TREE_LOAD,
				payload: {
					contentTree
				}
			});
			FilesService.openProjectTree(store.projectWindow.tree.path, (tree) => {
				dispatch({
					type: 'TREE_LOAD',
					payload: {
						tree: tree
					}
				});
			});
		});

		FilesService.openFile(file.path, (text) => {
			dispatch({
				type: 'LOAD_CODE_FILE',
				payload: {
					text
				}
			});
		}, () => {
			dispatch({
				type: 'LOAD_CODE_FILE',
				payload: {
					text: 'no content'
				}
			});
		});
		FilesService.openProjectTree(store.projectWindow.tree.path, (tree) => {
			dispatch({
				type: 'TREE_LOAD',
				payload: {
					tree: tree
				}
			});
		});
	};
}

export function openFile(file) {
	return (dispatch, getStore) => {
		let store = getStore();
		let files = store.projectWindow.openedFiles;
		let oldFile = store.projectWindow.activeFile;
		if (files.length >= 1) {
			for (let i = 0; i < files.length; i++) {
				if (oldFile.key === files[i].key) {
					files[i].mainWindow = store.mainWindow;
					break;
				}
			}
		}

		let exist = files.find((x) => {
			return x.key === file.key
		});
		if (exist === undefined) {
			file.tabKey = files.length;
			file.mainWindow = {
				textChanged: false
			};
			files.push(file);
			if (file.path) {
				FilesService.openFile(file.path, (text) => {
					dispatch({
						type: 'LOAD_CODE_FILE',
						payload: {
							text
						}
					});
				}, () => {
					dispatch({
						type: 'LOAD_CODE_FILE',
						payload: {
							text: 'no content'
						}
					});
				});
			} else {
				dispatch({
					type: 'LOAD_CODE_FILE',
					payload: {
						text: 'no content'
					}
				});
			}
			FilesService.openFile(file.docsPath, (text) => {
				dispatch({
					type: 'LOAD_FILE',
					text: text,
					link: file.docsPath
				});
				dispatch({
					type: FILE_OPENED,
					payload: {
						openedFiles: files,
						activeFile: file
					}
				});
			});
		} else {
			dispatch({
				type: 'LOAD_OPENED_FILE',
				payload: {
					mainWindow: exist.mainWindow
				}
			});
			dispatch({
				type: FILE_OPENED,
				payload: {
					openedFiles: files,
					activeFile: exist
				}
			});
		}
	};
}

export function closeFile() {
	return (dispatch, getStore) => {
		let store = getStore();

		let files = store.projectWindow.openedFiles;
		let activeFile = store.projectWindow.activeFile;

		let index = -1;
		for (let i = 0; i < files.length; i++) {
			if (files[i].key === activeFile.key) {
				index = i;
				break;
			}
		}

		CheckChangesService.checkCurrentFile(store, () => {
			files.splice(index, 1);
			if (files.length === 0) {
				dispatch({
					type: 'CLEAR_CURRENT_FILE'
				});
				dispatch({
					type: 'CLOSE_ALL_FILES'
				});
				return;
			}
			files.forEach(function(item, i) {
				item.tabKey = i;
			});
			if (index - 1 <= 0) {
				activeFile = files[0];
			} else {
				activeFile = files[index - 1];
			}

			dispatch({
				type: 'LOAD_OPENED_FILE',
				payload: {
					mainWindow: activeFile.mainWindow
				}
			});
			dispatch({
				type: FILE_OPENED,
				payload: {
					openedFiles: files,
					activeFile: activeFile
				}
			});
		});
	};
}

export function changeTabPosition(dragIndex, hoverIndex) {
	return (dispatch, getStore) => {
		let store = getStore();
		let files = store.projectWindow.openedFiles;
		let fileToSlice = files[dragIndex];
		files.splice(dragIndex, 1);
		files.splice(hoverIndex, 0, fileToSlice);
		files.forEach(function(item, index) {
			item.tabKey = index;
		});
		dispatch({
			type: DRAG_AND_DROP,
			payload: {
				openedFiles: files,
				dragAndDrop: !store.projectWindow.dragAndDrop
			}
		});
	};
}

export function beginDrag() {
	return {
		type: DRAG_AND_DROP_BEGIN
	};
}

export function loadFile(text, link) {
	return {
		type: 'LOAD_FILE',
		text,
		link
	};
}

export function updateTree(text, link) {
	return (dispatch, getStore) => {
		let store = getStore();
		let tree = store.projectWindow.tree;
		dispatch({
			type: 'TREE_LOAD',
			tree
		});
	}
}

export function changeContentTree(contentTree) {
	return (dispatch, getStore) => {
		let store = getStore();
		let tree = store.projectWindow.tree;
		FilesService.addContentTreeToConfig(tree.path, contentTree, (contentTree) => {
			dispatch({
				type: CONTENT_TREE_LOAD,
				payload: {
					contentTree
				}
			});
		});
	}
}


