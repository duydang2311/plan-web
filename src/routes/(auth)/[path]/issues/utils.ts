export const createQueryKey = (url: URL) => {
    const queryKey: unknown[] = [
        'issues',
        { team: url.searchParams.get('team'), project: url.searchParams.get('project') }
    ];
    return queryKey;
};
