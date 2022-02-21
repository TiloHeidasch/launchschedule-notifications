const axios = require("axios");
const fs = require("fs");
const raisedLaunchesFileName = "raisedLaunches.json";
const raisedEventsFileName = "raisedEvents.json";

async function requestFromLl(url) {
  try {
    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.error(error.body);
  }
}

async function sendNotificationsForUpcomingLaunches(err, raisedLaunches) {
  raisedLaunches = JSON.parse(raisedLaunches);
  const launches = await requestFromLl(
    "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=3"
  );
  const mappedLaunches = mapLaunches(launches);
  sendNotificationsForMappedData(mappedLaunches, raisedLaunches, true);
}
async function sendNotificationsForUpcomingEvents(err, raisedEvents) {
  raisedEvents = JSON.parse(raisedEvents);
  const events = await requestFromLl(
    "https://ll.thespacedevs.com/2.2.0/event/upcoming/?format=json&limit=3"
  );
  const mappedEvents = mapEvents(events);
  sendNotificationsForMappedData(mappedEvents, raisedEvents, false);
}
function mapLaunches(launches) {
  return launches.map((launch) => {
    const relatedTypeIds = [];
    if (launch.launch_service_provider) {
      relatedTypeIds.push({
        type: "agency",
        id: launch.launch_service_provider.id + "",
      });
    }
    if (launch.pad && launch.pad.location) {
      relatedTypeIds.push({
        type: "location",
        id: launch.pad.location.id + "",
      });
    }
    if (launch.pad) {
      relatedTypeIds.push({ type: "pad", id: launch.pad.id + "" });
    }
    if (launch.rocket && launch.rocket.configuration) {
      relatedTypeIds.push({
        type: "rocket",
        id: launch.rocket.configuration.id + "",
      });
    }
    return {
      id: launch.id + "",
      title: launch.name,
      date: launch.net,
      image: launch.image,
      status: launch.status.id,
      type: "launch",
      relatedTypeIds,
    };
  });
}
function mapEvents(events) {
  return events.map((event) => {
    const relatedTypeIds = [];
    if (event.spacestations[0]) {
      relatedTypeIds.push({
        type: "spacestation",
        id: event.spacestations[0].id + "",
      });
    }
    return {
      id: event.id + "",
      title: event.name,
      date: event.date,
      image: event.feature_image,
      status: -1,
      type: "event",
      relatedTypeIds,
    };
  });
}
function sendNotificationsForMappedData(
  mappedData,
  raisedNotifications,
  launches
) {
  let change = false;
  for (let index = 0; index < mappedData.length; index++) {
    const dataSet = mappedData[index];
    if (
      (isStatusOkToSend(dataSet.status) || dataSet.type === "event") &&
      !isDataSetIn(dataSet, raisedNotifications)
    ) {
      const timeDiff = new Date(dataSet.date).valueOf() - new Date().valueOf();
      const secondDiff = timeDiff / 1000;
      const minuteDiff = secondDiff / 60;
      if (minuteDiff <= 15 && minuteDiff >= 0) {
        raisedNotifications.push(dataSet);
        raiseNotification(dataSet);
        change = true;
      }
    }
  }
  if (change) {
    raisedNotifications = raisedNotifications.filter(
      (raisedNotification, index, array) => {
        const timeDiff =
          new Date(raisedNotification.date).valueOf() - new Date().valueOf();
        return timeDiff > 0;
      }
    );
    saveRaisedNotifications(raisedNotifications, launches);
  }
}
function isStatusOkToSend(status) {
  switch (status) {
    case 1: // Go for Launch
    case 3: // Launch Successful
    case 4: // Launch Failure
    case 5: // On hold
    case 6: // Launch in Flight
    case 7: // Launch was a partial failure
      return true;
    default:
      return false;
  }
}
async function raiseNotification(dataSet) {
  let condition = "'" + dataSet.type + dataSet.id + "' in topics";
  dataSet.relatedTypeIds.forEach((relatedTypeId) => {
    condition =
      condition +
      " || '" +
      relatedTypeId.type +
      relatedTypeId.id +
      "' in topics";
  });

  sendNotification(
    condition,
    "Upcoming " +
      dataSet.type +
      " in less than 15 Minutes at " +
      new Date(dataSet.date).toLocaleTimeString("de-DE", {timeZone: "Europe/Berlin"}) +
      " CET",
    dataSet.title,
    dataSet.image,
    dataSet.id,
    dataSet.type
  );
}

function sendNotification(condition, body, title, image, id, type) {
  // create FCM data
  const data = {
    condition,
    notification: {
      title,
      body,
      image,
    },
    data: {
      id,
      type,
    },
  };
  // send to FCM
  makePost("https://fcm.googleapis.com/fcm/send", JSON.stringify(data));
}
async function makePost(url, data) {
  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        //'Content-Length': data.length,
        Authorization: "key=" + process.env.FCM_TOKEN,
      },
    });
  } catch (error) {
    console.error(error.response.data);
  }
}

function readRaisedNotifications(launches, callback) {
  fs.readFile(
    launches ? raisedLaunchesFileName : raisedEventsFileName,
    "utf8",
    callback
  );
}

function saveRaisedNotifications(raisedNotifications, launches) {
  console.log("writing file");
  fs.writeFile(
    launches ? raisedLaunchesFileName : raisedEventsFileName,
    JSON.stringify(raisedNotifications),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("wrote file");
    }
  );
}

function isDataSetIn(dataSet, array) {
  if (array.length === 0) {
    return false;
  }
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if (element.id === dataSet.id && element.date === dataSet.date) {
      return true;
    }
  }
  return false;
}

readRaisedNotifications(true, sendNotificationsForUpcomingLaunches);
readRaisedNotifications(false, sendNotificationsForUpcomingEvents);
