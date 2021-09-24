import databaseHealthIndicatorFactory from './health/database-health-indicator';

export default function HealthChecker() {
  const databaseHealthIndicator = databaseHealthIndicatorFactory();

  async function doHealthCheck() {
    return new Promise(async (resolve, reject) => {
      try {
        // When new indicators were created, you should add them on this array.
        const indicatorsToHandle = [databaseHealthIndicator.handle()];
        const indicators = await Promise.all(indicatorsToHandle);

        const dependencies = indicators.reduce((accumulator, current) => {
          accumulator[current.name] = current.result;

          return accumulator;
        }, {});

        resolve(dependencies);
      } catch (error) {
        reject(error);
      }
    });
  }

  return {
    doHealthCheck,
  };
}
