import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {PlatformVarying, PlatformVaryingValue} from '../platform-varying';
import {BaseItemDescriptor} from './lists/cell-parsers';

export type ItemDescriptor = BaseItemDescriptor & { [key: string]: any };

export interface ParsingException {
  message?: string;
}

export interface ListRowParsingException extends ParsingException {
  col: number;
  property?: string;
  value?: any;
}

export type ParsingExceptions<T extends ParsingException = ParsingException> = {
  exceptions?: T[];
}

export type ParsedItem = PlatformVarying<ItemDescriptor> & ParsingExceptions<ListRowParsingException>;

export type ParsedSection = {
  title: string,
  index: number,
  items: ParsedItem[]
} & ParsingExceptions;

export type NormalizedItem = PlatformVaryingValue<ItemDescriptor>;

export async function loadDocument(file: string): Promise<Document> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  return new JSDOM(content).window.document;
}