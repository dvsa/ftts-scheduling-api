/* eslint-disable @typescript-eslint/unbound-method */
import { createClient, RedisClient } from 'redis';
import config from '../config';
import { logger } from '../logger';

export class RedisCacheClient {
  private static instance: RedisCacheClient;

  public static getInstance(): RedisCacheClient {
    if (!RedisCacheClient.instance) {
      RedisCacheClient.instance = new RedisCacheClient();
    }
    return RedisCacheClient.instance;
  }

  constructor(
    private client: RedisClient = createClient(config.redisClient),
  ) {
    this.client.on('connect', () => {
      logger.debug('RedisCacheClient::connect: successfully connected to redis');
    });
    this.client.on('error', (err) => {
      logger.error(err as Error, 'RedisCacheClient::onError: Redis connection error');
    });
  }

  public getAsync = async (key: string): Promise<string | null> => new Promise((resolve) => {
    this.client.get(key, (error, value) => {
      if (error) {
        logger.error(error, 'RedisCacheClient:getAsync: unable to get a value', { key });
        throw error;
      }
      resolve(value);
    });
  });

  public keysAsync = async (key: string): Promise<string[]> => new Promise((resolve) => {
    this.client.keys(key, (error, value) => {
      if (error) {
        logger.error(error, 'RedisCacheClient:keysAsync: unable to get key', { key });
        throw error;
      }
      resolve(value);
    });
  });

  public setExAsync = async (key: string, ttl: number, value: string): Promise<void> => new Promise((resolve) => {
    this.client.setex(key, ttl, value, (error) => {
      if (error) {
        logger.error(error, 'RedisCacheClient:setExAsync: unable to write key', { key, ttl, value });
        throw error;
      }
      resolve();
    });
  });

  public delAsync = async (key: string): Promise<void> => new Promise((resolve) => {
    this.client.del(key, (error) => {
      if (error) {
        logger.error(error, 'RedisCacheClient:delAsync: unable to delete key', { key });
        throw error;
      }
      resolve();
    });
  });
}
