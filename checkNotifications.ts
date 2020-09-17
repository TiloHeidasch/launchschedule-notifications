const axios = require('axios');

async function requestFromLl(url) {
  try {
    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.log(error.response.body);
  }
}

async function sendNotificationsForUpcomingLaunches() {
  const launches = await requestFromLl(
    'https://ll.thespacedevs.com/2.0.0/launch/upcoming/?format=json&limit=10',
  );
  const mappedLaunches = mapLaunches(launches);
  sendNotificationsForMappedData(mappedLaunches);
}
async function sendNotificationsForUpcomingEvents() {
  const events = await requestFromLl(
    'https://ll.thespacedevs.com/2.0.0/event/upcoming/?format=json&limit=10',
  );
  const mappedEvents = mapEvents(events);
  sendNotificationsForMappedData(mappedEvents);
}
function mapLaunches(launches) {
  return launches.map(launch => {
    const relatedTypeIds = [
      { type: 'agency', id: launch.launch_service_provider.id },
      { type: 'location', id: launch.pad.location.id },
      { type: 'pad', id: launch.pad.id },
      { type: 'rocket', id: launch.rocket.configuration.id },
    ];
    return {
      id: launch.id,
      title: launch.name,
      date: launch.net,
      image: launch.image,
      type: 'launch',
      relatedTypeIds,
    };
  });
}
function mapEvents(events) {
  return events.map(event => {
    const relatedTypeIds = [];
    if (event.spacestations[0]) {
      relatedTypeIds.push({
        type: 'spacestation',
        id: event.spacestations[0].id,
      });
    }
    return {
      id: event.id,
      title: event.name,
      date: event.date,
      image: event.feature_image,
      type: 'event',
      relatedTypeIds,
    };
  });
}
function sendNotificationsForMappedData(mappedData) {
  mappedData.forEach(dataSet => {
    const timeDiff = new Date(dataSet.date).valueOf() - new Date().valueOf();
    const secondDiff = timeDiff / 1000;
    const minuteDiff = secondDiff / 60;
    const hourDiff = minuteDiff / 60;
    const dayDiff = hourDiff / 24;
    if (minuteDiff < 5) {
      raiseNotification(dataSet, 'minute');
    } else if (hourDiff < 1) {
      raiseNotification(dataSet, 'hour');
    } else if (dayDiff < 1) {
      raiseNotification(dataSet, 'day');
    } else if (dayDiff < 7) {
      raiseNotification(dataSet, 'week');
    }
  });
}
async function raiseNotification(dataSet, notificationType) {
  const tokens = [];
  tokens.push(
    ...(await getTokens(
      dataSet.type,
      dataSet.id,
      notificationType,
      dataSet.date,
      undefined,
    )),
  );
  for (let index = 0; index < dataSet.relatedTypeIds.length; index++) {
    const relatedTypeId = dataSet.relatedTypeIds[index];
    tokens.push(
      ...(await getTokens(
        relatedTypeId.type,
        relatedTypeId.id,
        notificationType,
        dataSet.date,
        dataSet.type + '' + dataSet.id,
      )),
    );
  }
  const uniqueTokens = tokens.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
  if (uniqueTokens.length > 0) {
    raiseNotificationForTokenArray(uniqueTokens, dataSet, notificationType);
    markNotified(dataSet, notificationType, uniqueTokens);
  }
}
function markNotified(dataSet, notificationType, tokenArray) {
  tokenArray.forEach(token => {
    dataSet.relatedTypeIds.forEach(relatedTypeId => {
      // update token server
      makePost(
        'https://launchschedule-notifications.th105.de/interest/' +
          relatedTypeId.type +
          relatedTypeId.id +
          '/' +
          token,
        {
          notificationType,
          date: dataSet.date,
          relatedInterest: dataSet.type + '' + dataSet.id,
        },
      );
    });
    // update token server
    makePost(
      'https://launchschedule-notifications.th105.de/interest/' +
        dataSet.type +
        dataSet.id +
        '/' +
        token,
      {
        notificationType,
        date: dataSet.date,
      },
    );
  });
}

async function getTokens(type, id, notificationType, date, relatedInterest) {
  let url =
    'https://launchschedule-notifications.th105.de/interest/' +
    type +
    id +
    '?notificationType=' +
    notificationType +
    '&date=' +
    date;
  if (relatedInterest) {
    url += '&relatedInterest=' + relatedInterest;
  }
  const response = await axios.get(url);
  return response.data;
}

function raiseNotificationForTokenArray(tokenArray, dataSet, notificationType) {
  tokenArray.forEach(token => {
    raiseNotificationForToken(token, dataSet, notificationType);
  });
}
function raiseNotificationForToken(token, dataSet, notificationType) {
  sendNotification(
    token,
    'Upcoming ' + dataSet.type + ' in a ' + notificationType,
    dataSet.title,
    dataSet.image,
    dataSet.id,
    dataSet.type,
  );
}
function sendNotification(to, title, body, image, id, type) {
  // console.log({ to, title, body, image, id, type });
  // create FCM data
  const data = {
    to,
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
  makePost('https://fcm.googleapis.com/fcm/send', JSON.stringify(data));
}
async function makePost(url, data) {
  console.log(url);

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        //'Content-Length': data.length,
        Authorization: 'key=' + process.env.FCM_TOKEN,
      },
    });
  } catch (error) {
    console.log(error.response);
  }
}
sendNotificationsForUpcomingLaunches();
sendNotificationsForUpcomingEvents();
