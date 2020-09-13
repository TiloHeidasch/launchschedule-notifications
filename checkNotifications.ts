var https = require('https');

function requestUrl(url, mappingCallBack, actionCallBack) {
  https
    .get(url, resp => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', chunk => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        const recieved = JSON.parse(data);
        const mapped = mappingCallBack(recieved.results);
        actionCallBack(mapped);
      });
    })
    .on('error', err => {
      console.log('Error: ' + err.message);
    });
}
function sendNotificationsForUpcomingLaunches() {
  requestUrl(
    'https://ll.thespacedevs.com/2.0.0/launch/upcoming/?format=json&limit=10',
    mapLaunches,
    sendNotificationsForMappedData,
  );
}
function sendNotificationsForUpcomingEvents() {
  requestUrl(
    'https://ll.thespacedevs.com/2.0.0/event/upcoming/?format=json&limit=10',
    mapEvents,
    sendNotificationsForMappedData,
  );
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
function raiseNotification(dataSet, notificationType) {
  checkAndRaiseNotificationForTypeAndId(
    dataSet.type,
    dataSet.id,
    dataSet,
    notificationType,
    undefined,
  );
  dataSet.relatedTypeIds.forEach(relatedTypeId => {
    checkAndRaiseNotificationForTypeAndId(
      relatedTypeId.type,
      relatedTypeId.id,
      dataSet,
      notificationType,
      dataSet.type + '' + dataSet.id,
    );
  });
}
function checkAndRaiseNotificationForTypeAndId(
  type,
  id,
  dataSet,
  notificationType,
  relatedInterest,
) {
  let url =
    'https://launchschedule-notifications.th105.de/interest/' +
    type +
    id +
    '?notificationType=' +
    notificationType;
  if (relatedInterest) {
    url += '&relatedInterest=' + relatedInterest;
  }

  https
    .get(url, resp => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', chunk => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        const tokenArray = JSON.parse(data);
        raiseNotificationForTokenArray(
          type,
          id,
          tokenArray,
          dataSet,
          notificationType,
          relatedInterest,
        );
      });
    })
    .on('error', err => {
      console.log('Error: ' + err.message);
    });
}
function raiseNotificationForTokenArray(
  type,
  id,
  tokenArray,
  dataSet,
  notificationType,
  relatedInterest,
) {
  tokenArray.forEach(token => {
    raiseNotificationForToken(
      type,
      id,
      token,
      dataSet,
      notificationType,
      relatedInterest,
    );
  });
}
function raiseNotificationForToken(
  type,
  id,
  token,
  dataSet,
  notificationType,
  relatedInterest,
) {
  sendNotification(
    token,
    'Upcoming ' + dataSet.type + ' in a ' + notificationType,
    dataSet.title,
    dataSet.image,
    dataSet.id,
    dataSet.type,
  );
  let body;
  if (relatedInterest) {
    body = { notificationType, relatedInterest };
  } else {
    body = { notificationType };
  }
  // update token server
  makePost(
    'launchschedule-notifications.th105.de',
    443,
    '/interest/' + type + id + '/' + token,
    JSON.stringify(body),
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
  makePost('fcm.googleapis.com', 443, '/fcm/send', JSON.stringify(data));
}
function makePost(hostname, port, path, data) {
  const options = {
    hostname,
    port,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: 'key=' + process.env.FCM_TOKEN,
    },
  };

  const req = https.request(options, res => {
    //res.on('data', d => process.stdout.write(d));
  });

  req.on('error', error => {
    console.error(error);
  });

  req.write(data);
  req.end();
}
sendNotificationsForUpcomingLaunches();
sendNotificationsForUpcomingEvents();
