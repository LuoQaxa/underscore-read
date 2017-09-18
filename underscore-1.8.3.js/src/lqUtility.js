function isFunction(){

}
function isObject(){

}
function matcher() {
	// 返回一个断言函数，这个函数会给你一个断言可以用来辨别给定的对象是否匹配attrs指定键/值属性。
	var ready = _.matcher({selected: true, visible: true});
	var readyToGoList = _.filter(list, ready);
}

function property() {

}
