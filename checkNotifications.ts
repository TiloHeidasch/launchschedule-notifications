const axios = require('axios');

async function requestFromLl(url) {
  try {
    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.log(error.body);
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
    const relatedTypeIds = [];
    if (launch.launch_service_provider) {
      relatedTypeIds.push({
        type: 'agency',
        id: launch.launch_service_provider.id,
      });
    }
    if (launch.pad && launch.pad.location) {
      relatedTypeIds.push({ type: 'location', id: launch.pad.location.id });
    }
    if (launch.pad) {
      relatedTypeIds.push({ type: 'pad', id: launch.pad.id });
    }
    if (launch.rocket && launch.rocket.configuration) {
      relatedTypeIds.push({
        type: 'rocket',
        id: launch.rocket.configuration.id,
      });
    }
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
        dataSet.type,
        dataSet.id,
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
      put(
        'http://localhost:3000/notification/' +
          '?type=' +
          relatedTypeId.type +
          '&id=' +
          relatedTypeId.id +
          '&token=' +
          token +
          '&period=' +
          notificationType +
          '&date=' +
          dataSet.date +
          '&relatedType=' +
          dataSet.type +
          '&relatedId=' +
          dataSet.id,
      );
    });
    // update token server
    put(
      'http://localhost:3000/notification/' +
        '?type=' +
        dataSet.type +
        '&id=' +
        dataSet.id +
        '&token=' +
        token +
        '&period=' +
        notificationType +
        '&date=' +
        dataSet.date,
    );
  });
}

async function getTokens(
  type,
  id,
  notificationType,
  date,
  relatedInterestType,
  relatedInterestId,
) {
  let url =
    'http://localhost:3000/notification' + '?type=' + type + '&id=' + id;
  const response = await axios.get(url);
  const notifications = response.data;
  const tokens = [];
  notifications.forEach(notification => {
    let relevant = isRelevant(
      notification,
      type,
      id,
      notificationType,
      date,
      relatedInterestType,
      relatedInterestId,
    );
    if (relevant) {
      tokens.push(notification.token);
    }
  });

  return tokens;
}

function raiseNotificationForTokenArray(tokenArray, dataSet, notificationType) {
  tokenArray.forEach(token => {
    raiseNotificationForToken(token, dataSet, notificationType);
  });
}
function raiseNotificationForToken(token, dataSet, notificationType) {
  sendNotification(
    token,
    'Upcoming ' + dataSet.type + ' in less than a ' + notificationType,
    dataSet.title,
    dataSet.image,
    dataSet.id,
    dataSet.type,
  );
}
function sendNotification(to, title, body, image, id, type) {
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
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        //'Content-Length': data.length,
        Authorization: 'key=' + process.env.FCM_TOKEN,
      },
    });
  } catch (error) {
    console.error(error.response.data);
  }
}
async function put(url) {
  try {
    const response = await axios.put(url);
  } catch (error) {
    console.error(error.response.data);
  }
}
function isRelevant(
  notification,
  type,
  id,
  notificationType,
  date,
  relatedInterestType,
  relatedInterestId,
) {
  let relevant = true;
  notification.notified.forEach(notifiedElement => {
    if (
      notifiedElement.date === date &&
      (!relatedInterestType || !relatedInterestId)
    ) {
      switch (notificationType) {
        case 'week':
          if (notifiedElement.period === 'week') {
            relevant = false;
          }
        case 'day':
          if (notifiedElement.period === 'day') {
            relevant = false;
          }
        case 'hour':
          if (notifiedElement.period === 'hour') {
            relevant = false;
          }
        case 'minute':
          if (notifiedElement.period === 'minute') {
            relevant = false;
          }
          break;
        default:
          break;
      }
    }
    if (
      notifiedElement.date === date &&
      relatedInterestType &&
      relatedInterestId &&
      notifiedElement.relatedInterest &&
      notifiedElement.relatedInterest.id === relatedInterestId &&
      notifiedElement.relatedInterest.type === relatedInterestType
    ) {
      switch (notificationType) {
        case 'week':
          if (notifiedElement.period === 'week') {
            relevant = false;
          }
        case 'day':
          if (notifiedElement.period === 'day') {
            relevant = false;
          }
        case 'hour':
          if (notifiedElement.period === 'hour') {
            relevant = false;
          }
        case 'minute':
          if (notifiedElement.period === 'minute') {
            relevant = false;
          }
          break;
        default:
          break;
      }
    }
  });
  return relevant;
}
sendNotificationsForUpcomingLaunches();
sendNotificationsForUpcomingEvents();
