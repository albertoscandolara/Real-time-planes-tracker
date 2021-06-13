const updateInterval = 5000; // ms
const maxShowablePlanes = 20;
const airplaneInfoUrl = "https://opensky-network.org/api/states/all";

window.alert(
  `Flights shown are limited to ${maxShowablePlanes}, 
  but there's no way to tell the 3rd party API to not fetch all data. 
  Therefore it takes a while before planes are displayed.`
);

mapboxgl.accessToken =
  "pk.eyJ1IjoiYmViaXV6IiwiYSI6ImNrcGlobXB0NDAyamUycWxndXN1Zjl6NXAifQ.WFz7mt4I5KdPGRYSpPFR2Q";

let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-71.0, 20.0],
  zoom: 2,
});

// Add styles
let styles = {
  satellite: {
    text: "satellite",
    value: "satellite-v9",
  },
  light: {
    text: "light",
    value: "light-v10",
  },
  dark: {
    text: "dark",
    value: "dark-v10",
  },
  outdoors: {
    text: "outdoors",
    value: "outdoors-v11",
  },
  streets: {
    text: "streets",
    value: "streets-v11",
  },
};

Object.entries(styles).forEach(([key, value]) => {
  let button = document.createElement("button");
  button.textContent = value.text;
  button.title = value.text;
  button.id = value.value;

  button.addEventListener("click", function (e) {
    var layerId = e.target.id;
    if (!layerId) return;

    map.setStyle("mapbox://styles/mapbox/" + layerId);
  });

  let parent = document.querySelector(".style-buttons");
  parent.appendChild(button);
});

let planes = [];
let markersDict = {};

async function getAirplanesInfo() {
  const url = airplaneInfoUrl;
  const res = await fetch(url);
  planes = await res.json();
  console.log(planes);
  drawOnMap();
}

const drawOnMap = function () {
  for (let i = 0; i < maxShowablePlanes; i++) {
    let plane = planes.states[i];

    let id = plane[0];
    let planeCoordinates = [plane[5], plane[6]];

    if (id in markersDict) {
      // Update marker position
      movePlane(id, planeCoordinates, plane);
    } else {
      // Draw new marker
      let marker = drawPlane(planeCoordinates, plane);
      markersDict[id] = marker;
    }
  }

  // Remove useless markers
  Object.keys(markersDict).forEach((id) => {
    if (!planes.states.some((plane) => plane[0] === id)) {
      removePlane(id);
    }
  });
};

const removePlane = function (id) {
  markersDict[id].addTo(map).setLngLat([0, 0]).remove();
};

const movePlane = function (id, newCoordinates, plane) {
  markersDict[id]
    .setLngLat(newCoordinates)
    .setPopup(new mapboxgl.Popup().setHTML(setPlaneMarkerPopupMarkup(plane)));
};

const drawPlane = function (newCoordinates, plane) {
  let el = document.createElement("div");
  el.className = "marker";

  let marker = new mapboxgl.Marker(el)
    .setLngLat(newCoordinates)
    .setPopup(new mapboxgl.Popup().setHTML(setPlaneMarkerPopupMarkup(plane)))
    .addTo(map);

  if (!marker) return;
  const markerDiv = marker.getElement();
  markerDiv.addEventListener("mouseenter", () => marker.togglePopup());
  markerDiv.addEventListener("mouseleave", () => marker.togglePopup());

  return marker;
};

const setPlaneMarkerPopupMarkup = function (planeData) {
  return (markup = `
    <div class="pop-up">
      <div class="pop-up-header">
        <span>Flight: ${planeData[1]}</span>
      </div>
      <div class="pop-up-body">
        <span>Deparure location: ${planeData[2] ? planeData[2] : "-"}</span>
        <span>Speed: ${
          planeData[9]
            ? Math.round(planeData[9] * 3.6 * 100) / 100 + "km/h"
            : "-"
        }</span>
        <span>Altitude: ${
          planeData[13]
            ? Math.round((planeData[13] / 1000) * 100) / 100 + "km"
            : "-"
        }</span>
        <span>Last update: ${
          planeData[4] ? convertUnixToDate(planeData[4]) : "-"
        }</span>
        
      </div>
    </div>`);
};

const convertUnixToDate = function (unixTime) {
  return new Date(unixTime * 1000).toLocaleString();
};

const init = async function () {
  const url = airplaneInfoUrl;
  const res = await fetch(url);
  planes = await res.json();
  drawOnMap();

  setTimeout(init, updateInterval);
};

setTimeout(init, updateInterval);
