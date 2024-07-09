import { Brand } from '@type_util/index';
import { ValidationTrait } from '..';
import { BaseException, BaseExceptionBhv } from '@logic/exception.base';

export type URL = Brand<string, 'URL'>;

const isUrl = (s: string): s is URL => {
  const regex =
    /^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|^((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)$|^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?$/g;
  return regex.test(s);
};

export const parseURL = (s: string) => {
  return isUrl(s)
    ? ValidationTrait.right<URL, BaseException>(s)
    : ValidationTrait.left<URL, BaseException>(
        BaseExceptionBhv.construct('url is malformed', 'URL_INCORRECT'),
      );
};
