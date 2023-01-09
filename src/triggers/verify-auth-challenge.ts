export const verifyAuthChallenge = async (event: any) => {
  console.log('RECEIVED Event: ', JSON.stringify(event, null, 2));

  const expectedAnswer =
    event.request.privateChallengeParameters.challenge || null;

  if (event.request.challengeAnswer === expectedAnswer) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }

  console.log('RETURNED Event: ', JSON.stringify(event, null, 2));

  return event;
};
