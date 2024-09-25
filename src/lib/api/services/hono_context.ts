import { Context } from 'effect';
import type { Context as __HonoContext } from 'hono';

export class HonoContext extends Context.Tag('@app/HonoContext')<HonoContext, __HonoContext>() {}
