const store = chrome.storage.sync

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)
const getDateDetails = () => {
	const today = new Date();
	const dd = today.getDate();
	const yyyy = today.getFullYear();
	const ye = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(today);
	const mo = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(today);

	return {
		day: capitalizeFirstLetter(ye),
		month: capitalizeFirstLetter(mo),
		date: dd,
		year : yyyy
	}
}

class WidgetBase {
	constructor(context, gridContainer, extra) {
		this.update.bind(this)
		this.render.bind(this)
		this.unload.bind(this)
		this._context = context
		this._container = gridContainer
		this._extra = extra
	}
	get container() {
		return this._container
	}
	get extra() {
		return this._extra
	}
	_changeLayout(config) {
		const {pX, pY, w, h, w1 = 0, h1 = 0} = config
		this._container.style.gridArea =
			`${pY >= 0 ? (pY+1) : pY} / ${pX >= 0 ? (pX+1) : pX} / ${h ? ('span ' + h) : h1} / ${w ? ('span ' + w) : w1}`
	}
	update() {
		this._context._notifyRender(this)
		this.render(this._container)
	}
	render(container) {
		container.style.backgroundColor = "#d20000"
		container.style.color = "#fff"
		container.style.padding = "8px"
		container.innerHTML = "<b>Warning: Widget should override render() function without calling super.render()</b>"
	}
	unload() {}
}

class ClockWidget extends WidgetBase {
	constructor(context, gridContainer, extra) {
		super(context, gridContainer, extra);
		this.checkTime = (i) => ((i < 10) ? "0" + i : i)

		gridContainer.style.display = "flex"
		gridContainer.style.flexDirection = "column"
		gridContainer.style.alignItems = "center"
		gridContainer.style.justifyContent = "center"

		this.timeEl = document.createElement('span')
		this.timeEl.style.display = "block"
		this.timeEl.style.textAlign = "center"
		this.timeEl.style.fontSize = "20vh"
		this.timeEl.style.fontWeight = "100"
		this.timeEl.style.textShadow = "0 0 2px gray"
		gridContainer.appendChild(this.timeEl)

		this.secondRowEl = document.createElement('span')
		this.secondRowEl.style.display = "block"
		this.secondRowEl.style.textAlign = "center"
		this.secondRowEl.style.fontSize = "4vh"
		this.secondRowEl.style.fontWeight = "200"
		this.secondRowEl.style.textShadow = "0 0 2px gray"
		gridContainer.appendChild(this.secondRowEl)

		this.dateEl = document.createElement('span')
		this.secondRowEl.appendChild(this.dateEl)

		this.weatherIconEl = document.createElement('img')
		this.weatherIconEl.id = "weather-icon"
		this.weatherIconEl.style.width = "30px"
		this.weatherIconEl.style.height = "30px"
		this.weatherIconEl.style.margin = "0 16px"
		this.secondRowEl.appendChild(this.weatherIconEl)

		this.weatherEl = document.createElement('a')
		this.secondRowEl.appendChild(this.weatherEl)

		this.timeUpdateTimer = setInterval(() => this.update(), 1000)
		this.weatherUpdateTimer = setInterval(() => this.fetchWeather(), 900000)
		this.fetchWeather()

		this.timeEl.onmouseover = ()=>{
			this.timeEl.innerText = "dateSeconds";
			//aaa heres the problem
			//thats a string just to test
		}
	}

	async fetchWeather() {
		// change unit to selected by user in dialog or if location = us (default )
		let city, unit = "metric"
		try {
			const ipApiRes = await fetch(`http://ip-api.com/json/?fields=city`)
			const ipApiJson = await ipApiRes.json()
			city = ipApiJson.city
		} catch (e) {
			return console.warn("Geolocation failed")
		}
		this.weatherEl.href = `https://openweathermap.org/city/${city}`
		this.weatherEl.style.color = "white";
		this.weatherEl.style.textDecoration = "none";

		fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=422958391a36158a7baf2910a96df05c`)
			.then(res => res.json())
			.then(res => {
				let icon = '', weatherId = res.weather[0].id
				if (weatherId === 800) icon = '/res/weather-icons/021-sun.svg'
				else if (weatherId >= 200 && weatherId < 300) icon = '/res/weather-icons/021-storm.svg'
				else if (weatherId >= 300 && weatherId < 600) icon = '/res/weather-icons/021-rain-2.svg'
				else if (weatherId >= 600 && weatherId < 700) icon = '/res/weather-icons/021-snowing-1.svg'
				else if (weatherId > 800 && weatherId < 810) icon = '/res/weather-icons/021-cloudy-1.svg'

				this.weatherIconEl.src = icon
				this.weatherEl.innerHTML = `${Math.round(res.main.temp)} °C`
			})
			.catch(e => console.log(e))
	}

	render(container) {
		const today = new Date(),
			h = this.checkTime(today.getHours()),
			m = this.checkTime(today.getMinutes()),
			s = this.checkTime(today.getSeconds())
		//time = timeTo12HrFormat(time);
		this.timeEl.innerHTML = `${h}:${m}`
		this.timeEl.id = "clock";

		const d = getDateDetails()
		this.dateEl.innerHTML = `${d.day}, ${d.month} ${d.date}`


		

		
		
	}
	unload() {
		clearInterval(this.timeUpdateTimer)
		clearInterval(this.weatherUpdateTimer)
	}
}


class LinkWidget extends WidgetBase {
	constructor(context, gridContainer, extra) {
		super(context, gridContainer, extra)

		gridContainer.style.display = "flex"
		gridContainer.style.flexDirection = "column"
		gridContainer.style.alignItems = "center"
		gridContainer.style.justifyContent = "center"
		gridContainer.style.cursor = "pointer"
		gridContainer.onclick = () => document.location.href = extra.rel

		this.iconEl = document.createElement('img')
		this.iconEl.style.display = "block"
		this.iconEl.style.width = "24px"
		this.iconEl.style.height = "24px"
		this.iconEl.style.backgroundColor = extra.color || "#e9e9e9"
		this.iconEl.style.padding = "12px"
		this.iconEl.style.borderRadius = "25%"
		this.iconEl.style.marginBottom = "8px"
		this.iconEl.src = `chrome://favicon/${extra.rel}`
		gridContainer.appendChild(this.iconEl)

		this.labelEl = document.createElement('span')
		this.labelEl.style.overflow = "hidden"
		this.labelEl.style.textOverflow = "ellipsis"
		this.labelEl.style.textAlign = "center"
		this.labelEl.style.display = "-webkit-box"
		this.labelEl.style.webkitLineClamp = "1"
		this.labelEl.style.webkitBoxOrient = "vertical"
		this.labelEl.innerText = extra.label || extra.rel
		gridContainer.appendChild(this.labelEl)
	}

	render(container) { }
}



class MyCustomWidget extends WidgetBase {
	constructor(context, gridContainer, extra) {
		super(context, gridContainer, extra)
		this.deviceState = {
			connection: null,
			batteryHealth: null
		}
		this.devices = []
		this.loadSensorsData().then(() => this.update())
		this.loadDevicesHistory().then(() => this.update())
	}
	async loadSensorsData() {
		const battery = await navigator.getBattery()
		const connection = navigator.onLine ? '~' + navigator.connection.downlink + ' Mbps ' : 'Offline '
		const batteryHealth = (battery.level * 100).toFixed() + '% ' + (battery.charging ? 'Charging' : 'Battery');

		this.deviceState.connection = connection;
		this.deviceState.batteryHealth = batteryHealth;
	}
	async loadDevicesHistory() {
		return new Promise((resolve) => {
			// noinspection JSUnresolvedVariable
			chrome.sessions.getDevices((res) => {
				this.devices = res || []
				resolve()
			})
		})
	}

	render(container) {
		document.getElementById('battery').innerHTML = `${this.deviceState.connection} - ${this.deviceState.batteryHealth}`
		const devices = this.devices
		let format = "<span style='font-size: 2vh;padding: 8px;;text-shadow: 0 0 2px gray;'><strong style='font-size: 2vh;text-shadow: 0 0 2px gray;'>DEVICE</strong> > LINK<span>";
		for (let i = 0; i < devices.length; i++) {
			let lastSession = devices[i].sessions;
			if (lastSession.length > 0) {

				lastSession = lastSession[0];
				let orgLink = lastSession.window['tabs'][0]['url'];
				let sessionLink = orgLink.substring(0, 20);

				sessionLink = `<a href="${orgLink}" target='_blank' rel='noopenner' style='color:white;text-decoration: none;'>${sessionLink}</a>`;

				let domContent = format.replace("DEVICE", devices[i].deviceName);
				domContent = domContent.replace("LINK", sessionLink);
				document.getElementById('device').innerHTML += domContent;
			}
		}
	}
}


class TabContext {
	constructor() {
		this.gridSizeInfo = {
			width: -1, height: -1,
			columns: -1, rows: -1
		}
		this.widgets = []
		this.renderStats = {
			counter: 0, counterSnapshot: 0, v: 0,
			start: Date.now()
		}
		this.debugEnabled = true
		this.debugAlt = false
		this.updateBackground()
		this.onLayoutChange = () => {}
		window.onresize = () => this.probeLayoutInfo().then(() => this.updateDebugWidget())
		setTimeout(() => this.probeLayoutInfo(), 500)
		setTimeout(() => this.probeLayoutInfo(), 1000)
		setInterval(() => {
			this.renderStats.v = (this.renderStats.counter - this.renderStats.counterSnapshot)
			this.renderStats.counterSnapshot = this.renderStats.counter
			this.updateDebugWidget()
		}, 1000)

		const debugEl = document.getElementById('status-debug')
		debugEl.onmouseenter = () => {
			this.debugAlt = true
			for (let i = 0; i < this.widgets.length; i++) {
				const w = this.widgets[i]
				w.container.style.outline = "2px dashed #00FF91"
				w.container.style.backgroundColor = "#00FF9133"
			}
		}
		debugEl.onmouseleave = () => {
			this.debugAlt = false
			for (let i = 0; i < this.widgets.length; i++) {
				const w = this.widgets[i]
				w.container.style.outline = "unset"
				w.container.style.backgroundColor = "unset"
			}
		}
	}

	async _notifyRender(src) {
		this.renderStats.counter++
		if (this.debugAlt) {
			if (src.__tmp_timer_id) clearTimeout(src.__tmp_timer_id)
			src.container.style.outline = "2px dashed #FF00D5"
			src.__tmp_timer_id = setTimeout(() => {
				src.__tmp_timer_id = undefined
				if (this.debugAlt) {
					src.container.style.outline = "2px dashed #00FF91"
				} else {
					src.container.style.outline = "unset"
					src.container.style.backgroundColor = "unset"
				}
			}, 150)
		}
		this.updateDebugWidget()
	}

	async updateBackground() {
		const dom = document.getElementById("bgimg")
		dom.style.backgroundColor = '#333333'

		const error = () => {
			const bgnum = (Math.floor(Math.random() * 6) + 1)
			console.log(bgnum)
			dom.style.backgroundImage = `url(res/bg/${bgnum}.jpg)`
		}

		fetch('https://source.unsplash.com/1600x900/?winter,wallpaper,nature,arquitecture,city')
			.then(imagelists => {
				const selectedImage = imagelists.url
				console.log(selectedImage)
				if (selectedImage.startsWith("https://images.unsplash.com/source-404")) {
					return error()
				}
				dom.style.backgroundImage = `url(${selectedImage})`
			})
			.catch(error)
	}

	async probeLayoutInfo() {
		const element = document.getElementById('ref-lay-grid')
		const computedStyle = window.getComputedStyle(element)
		const old = {...this.gridSizeInfo}
		this.gridSizeInfo.width = element.clientWidth
		this.gridSizeInfo.height = element.clientHeight
		this.gridSizeInfo.columns = computedStyle.gridTemplateColumns.split(" ").length
		this.gridSizeInfo.rows = computedStyle.gridTemplateRows.split(" ").length

		this.onLayoutChange(old, {...this.gridSizeInfo})
	}

	updateDebugWidget() {
		let data = "debugging enabled"
		data += `, layout size: [${this.gridSizeInfo.width} × ${this.gridSizeInfo.height}] (${this.gridSizeInfo.columns} × ${this.gridSizeInfo.rows})`
		data += `, widgets attached: ${this.widgets.length}`
		data += `, updates/sec: ${this.renderStats.v}`

		document.getElementById('status-debug').innerHTML = data
	}

	/**
	 * Creates a new widget and attaches it to the grid
	 * @param constructor reference to widget class
	 * @param extra extra options to be passed to the widget
	 * @param pX x position of widget (in grid lines)
	 * @param pY y position of widget (in grid lines)
	 * @param w width of widget (in grid lines)
	 * @param h height of widget (in grid lines)
	 * @param w1 end x position of widget (in grid lines) this parameter takes effect only if w is 0
	 * @param h1 end y position of widget (in grid lines) this parameter takes effect only if y is 0
	 * @returns {boolean|WidgetBase} returns constructed widget of false on error
	 */
	createWidget(constructor, extra, pX, pY, w, h, w1 = 0, h1 = 0) {
		const container = document.createElement("div")
		document.getElementById('ref-lay-grid').appendChild(container)
		try {
			const widget = new constructor(this, container, extra || {})
			if (widget) {
				this.widgets.push(widget)
				widget._changeLayout({pX, pY, w, h, w1, h1})
				widget.update()
				this.updateDebugWidget()
				return widget
			} else
				return false
		} catch (e) {
			console.error(`Unhandled error while creating widget: ${e}`)
			return false
		}
	}

	/**
	 * Unloads all widgets
	 */
	destroy() {
		for (let i = 0; i < this.widgets.length; i++) {
			this.widgets[i].unload()
		}
		this.widgets.length = 0
	}
}

window.tabContext = new TabContext()
window.tabContext.createWidget(ClockWidget, undefined, 0, 0, 0, 3, -1);

// initialize widgets for top sites
(() => {
	const topSitesWidgets = []
	// load top sites widgets at first with no layout parameters
	chrome.topSites.get(res => {
		for (let i = 0; i < res.length; i++) {
			topSitesWidgets.push(
				window.tabContext.createWidget(LinkWidget,
					{rel: res[i].url, label: res[i].title},
					0, 0, 0, 0)
			)
		}
	})
	// update layout parameters on layout change
	window.tabContext.onLayoutChange = (oldState, newState) => {
		const availableHeight = newState.rows - 3
		for (let i = 0; i < topSitesWidgets.length; i++) {
			topSitesWidgets[i]._changeLayout({
				pX: Math.floor(i / availableHeight),
				pY: 3 + Math.floor(i % availableHeight),
				w: 1, h: 1
			})
		}
	}
})()
