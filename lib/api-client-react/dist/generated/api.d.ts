import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CreateEntryBody, Entry, ErrorResponse, HealthStatus, ListEntriesParams, StatsSummary, UpdateEntryBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all viewing log entries
 */
export declare const getListEntriesUrl: (params?: ListEntriesParams) => string;
export declare const listEntries: (params?: ListEntriesParams, options?: RequestInit) => Promise<Entry[]>;
export declare const getListEntriesQueryKey: (params?: ListEntriesParams) => readonly ["/api/entries", ...ListEntriesParams[]];
export declare const getListEntriesQueryOptions: <TData = Awaited<ReturnType<typeof listEntries>>, TError = ErrorType<unknown>>(params?: ListEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEntriesQueryResult = NonNullable<Awaited<ReturnType<typeof listEntries>>>;
export type ListEntriesQueryError = ErrorType<unknown>;
/**
 * @summary List all viewing log entries
 */
export declare function useListEntries<TData = Awaited<ReturnType<typeof listEntries>>, TError = ErrorType<unknown>>(params?: ListEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Add a new entry to the viewing log
 */
export declare const getCreateEntryUrl: () => string;
export declare const createEntry: (createEntryBody: CreateEntryBody, options?: RequestInit) => Promise<Entry>;
export declare const getCreateEntryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
        data: BodyType<CreateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
    data: BodyType<CreateEntryBody>;
}, TContext>;
export type CreateEntryMutationResult = NonNullable<Awaited<ReturnType<typeof createEntry>>>;
export type CreateEntryMutationBody = BodyType<CreateEntryBody>;
export type CreateEntryMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Add a new entry to the viewing log
 */
export declare const useCreateEntry: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
        data: BodyType<CreateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEntry>>, TError, {
    data: BodyType<CreateEntryBody>;
}, TContext>;
/**
 * @summary Get a single entry by ID
 */
export declare const getGetEntryUrl: (id: number) => string;
export declare const getEntry: (id: number, options?: RequestInit) => Promise<Entry>;
export declare const getGetEntryQueryKey: (id: number) => readonly [`/api/entries/${number}`];
export declare const getGetEntryQueryOptions: <TData = Awaited<ReturnType<typeof getEntry>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEntry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEntry>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEntryQueryResult = NonNullable<Awaited<ReturnType<typeof getEntry>>>;
export type GetEntryQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single entry by ID
 */
export declare function useGetEntry<TData = Awaited<ReturnType<typeof getEntry>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEntry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update an entry's status or title
 */
export declare const getUpdateEntryUrl: (id: number) => string;
export declare const updateEntry: (id: number, updateEntryBody: UpdateEntryBody, options?: RequestInit) => Promise<Entry>;
export declare const getUpdateEntryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
        id: number;
        data: BodyType<UpdateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
    id: number;
    data: BodyType<UpdateEntryBody>;
}, TContext>;
export type UpdateEntryMutationResult = NonNullable<Awaited<ReturnType<typeof updateEntry>>>;
export type UpdateEntryMutationBody = BodyType<UpdateEntryBody>;
export type UpdateEntryMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update an entry's status or title
 */
export declare const useUpdateEntry: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
        id: number;
        data: BodyType<UpdateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEntry>>, TError, {
    id: number;
    data: BodyType<UpdateEntryBody>;
}, TContext>;
/**
 * @summary Delete an entry
 */
export declare const getDeleteEntryUrl: (id: number) => string;
export declare const deleteEntry: (id: number, options?: RequestInit) => Promise<Entry>;
export declare const getDeleteEntryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
    id: number;
}, TContext>;
export type DeleteEntryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEntry>>>;
export type DeleteEntryMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Delete an entry
 */
export declare const useDeleteEntry: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEntry>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get summary counts by media type and status
 */
export declare const getGetStatsSummaryUrl: () => string;
export declare const getStatsSummary: (options?: RequestInit) => Promise<StatsSummary>;
export declare const getGetStatsSummaryQueryKey: () => readonly ["/api/entries/stats/summary"];
export declare const getGetStatsSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getStatsSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStatsSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getStatsSummary>>>;
export type GetStatsSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get summary counts by media type and status
 */
export declare function useGetStatsSummary<TData = Awaited<ReturnType<typeof getStatsSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map