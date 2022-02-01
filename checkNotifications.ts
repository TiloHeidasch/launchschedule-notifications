const axios = require("axios");

async function requestFromLl(url) {
  console.log({ function: "requestFromLl", url });
  try {
    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.log(error.body);
  }
}

async function sendNotificationsForUpcomingLaunches() {
  console.log({ function: "sendNotificationsForUpcomingLaunches" });
  const launches = await requestFromLl(
    "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=10"
  );
  const mappedLaunches = mapLaunches(launches);
  sendNotificationsForMappedData(mappedLaunches);
}
async function sendNotificationsForUpcomingEvents() {
  console.log({ function: "sendNotificationsForUpcomingEvents" });
  const events = await requestFromLl(
    "https://lldev.thespacedevs.com/2.2.0/event/upcoming/?format=json&limit=10"
  );
  const mappedEvents = mapEvents(events);
  sendNotificationsForMappedData(mappedEvents);
}
function mapLaunches(launches) {
  console.log({ function: "mapLaunches", launches });
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
  console.log({ function: "mapEvents", events });
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
function sendNotificationsForMappedData(mappedData) {
  console.log({ function: "sendNotificationsForMappedData", mappedData });
  mappedData.forEach((dataSet) => {
    if (isStatusOkToSend(dataSet.status) || dataSet.type === "event") {
      const timeDiff = new Date(dataSet.date).valueOf() - new Date().valueOf();
      const secondDiff = timeDiff / 1000;
      const minuteDiff = secondDiff / 60;
      if (minuteDiff <= 15) {
        raiseNotification(dataSet);
      }
    }
  });
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
  console.log({ function: "raiseNotification", dataSet });
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
      new Date(dataSet.date).toLocaleTimeString("de") +
      " CET",
    dataSet.title,
    dataSet.image,
    dataSet.id,
    dataSet.type
  );
}

function sendNotification(condition, body, title, image, id, type) {
  console.log({
    function: "sendNotification",
    condition,
    title,
    body,
    image,
    id,
    type,
  });
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
  console.log({ function: "makePost", url, data });

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        //'Content-Length': data.length,
        //Authorization: "key=" + process.env.FCM_TOKEN,
        Authorization:
          "key=AAAAkONouqA:APA91bE3-2SHlQFyYrKN7HbDOv2WAC9glZlbv0J-AnJ0P-8xWtHE0rI8ElWh7XUtCQjvDubf37GhP0iVyNOKEEYX-GO43dwnPzor50o3Onjz8YyRxi7r009YDxJeY1V2H-FkQ4ovs15m",
      },
    });
  } catch (error) {
    console.error(error.response.data);
  }
}
sendNotificationsForUpcomingLaunches();
// sendNotificationsForUpcomingEvents();
