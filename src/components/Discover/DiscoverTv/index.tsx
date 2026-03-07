import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import type { FilterOptions } from '@app/components/Discover/constants';
import {
  countActiveFilters,
  prepareFilterValues,
} from '@app/components/Discover/constants';
import FilterSlideover from '@app/components/Discover/FilterSlideover';
import useDiscover from '@app/hooks/useDiscover';
import useTheme from '@app/hooks/useTheme';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import Error from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { BarsArrowDownIcon, FunnelIcon } from '@heroicons/react/24/solid';
import type { SortOptions as TMDBSortOptions } from '@server/api/themoviedb';
import type { TvResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.DiscoverTv', {
  discovertv: 'Series',
  activefilters:
    '{count, plural, one {# Active Filter} other {# Active Filters}}',
  sortPopularityAsc: 'Popularity Ascending',
  sortPopularityDesc: 'Popularity Descending',
  sortFirstAirDateAsc: 'First Air Date Ascending',
  sortFirstAirDateDesc: 'First Air Date Descending',
  sortTmdbRatingAsc: 'TMDB Rating Ascending',
  sortTmdbRatingDesc: 'TMDB Rating Descending',
  sortTitleAsc: 'Title (A-Z) Ascending',
  sortTitleDesc: 'Title (Z-A) Descending',
});

const SortOptions: Record<string, TMDBSortOptions> = {
  PopularityAsc: 'popularity.asc',
  PopularityDesc: 'popularity.desc',
  FirstAirDateAsc: 'first_air_date.asc',
  FirstAirDateDesc: 'first_air_date.desc',
  TmdbRatingAsc: 'vote_average.asc',
  TmdbRatingDesc: 'vote_average.desc',
  TitleAsc: 'original_title.asc',
  TitleDesc: 'original_title.desc',
} as const;

const DiscoverTv = () => {
  const intl = useIntl();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const preparedFilters = prepareFilterValues(router.query);
  const updateQueryParams = useUpdateQueryParams({});
  const { theme } = useTheme();
  const isAmoled = theme === 'amoled-strix';

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<TvResult, never, FilterOptions>('/api/v1/discover/tv', {
    ...preparedFilters,
  });

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discovertv);

  return (
    <>
      <PageTitle title={title} />
      <FilterSlideover
        type="tv"
        currentFilters={preparedFilters}
        onClose={() => setShowFilters(false)}
        show={showFilters}
      />
      {isAmoled ? (
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white/90">{title}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 ring-1 ring-white/[0.08] backdrop-blur-md">
              <BarsArrowDownIcon className="h-4 w-4 flex-shrink-0 text-white/40" />
              <select
                id="sortBy"
                name="sortBy"
                className="appearance-none bg-transparent text-xs font-medium text-white/70 outline-none"
                value={preparedFilters.sortBy || SortOptions.PopularityDesc}
                onChange={(e) => updateQueryParams('sortBy', e.target.value)}
              >
                <option value={SortOptions.PopularityDesc}>{intl.formatMessage(messages.sortPopularityDesc)}</option>
                <option value={SortOptions.PopularityAsc}>{intl.formatMessage(messages.sortPopularityAsc)}</option>
                <option value={SortOptions.FirstAirDateDesc}>{intl.formatMessage(messages.sortFirstAirDateDesc)}</option>
                <option value={SortOptions.FirstAirDateAsc}>{intl.formatMessage(messages.sortFirstAirDateAsc)}</option>
                <option value={SortOptions.TmdbRatingDesc}>{intl.formatMessage(messages.sortTmdbRatingDesc)}</option>
                <option value={SortOptions.TmdbRatingAsc}>{intl.formatMessage(messages.sortTmdbRatingAsc)}</option>
                <option value={SortOptions.TitleAsc}>{intl.formatMessage(messages.sortTitleAsc)}</option>
                <option value={SortOptions.TitleDesc}>{intl.formatMessage(messages.sortTitleDesc)}</option>
              </select>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/70 ring-1 ring-white/[0.08] backdrop-blur-md transition hover:bg-white/10 hover:text-white"
            >
              <FunnelIcon className="h-4 w-4 text-white/40" />
              {intl.formatMessage(messages.activefilters, {
                count: countActiveFilters(preparedFilters),
              })}
              {countActiveFilters(preparedFilters) > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {countActiveFilters(preparedFilters)}
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
          <Header>{title}</Header>
          <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
            <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                <BarsArrowDownIcon className="h-6 w-6" />
              </span>
              <select
                id="sortBy"
                name="sortBy"
                className="rounded-r-only"
                value={preparedFilters.sortBy || SortOptions.PopularityDesc}
                onChange={(e) => updateQueryParams('sortBy', e.target.value)}
              >
                <option value={SortOptions.PopularityDesc}>{intl.formatMessage(messages.sortPopularityDesc)}</option>
                <option value={SortOptions.PopularityAsc}>{intl.formatMessage(messages.sortPopularityAsc)}</option>
                <option value={SortOptions.FirstAirDateDesc}>{intl.formatMessage(messages.sortFirstAirDateDesc)}</option>
                <option value={SortOptions.FirstAirDateAsc}>{intl.formatMessage(messages.sortFirstAirDateAsc)}</option>
                <option value={SortOptions.TmdbRatingDesc}>{intl.formatMessage(messages.sortTmdbRatingDesc)}</option>
                <option value={SortOptions.TmdbRatingAsc}>{intl.formatMessage(messages.sortTmdbRatingAsc)}</option>
                <option value={SortOptions.TitleAsc}>{intl.formatMessage(messages.sortTitleAsc)}</option>
                <option value={SortOptions.TitleDesc}>{intl.formatMessage(messages.sortTitleDesc)}</option>
              </select>
            </div>
            <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
              <Button onClick={() => setShowFilters(true)} className="w-full">
                <FunnelIcon />
                <span>
                  {intl.formatMessage(messages.activefilters, {
                    count: countActiveFilters(preparedFilters),
                  })}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isReachingEnd={isReachingEnd}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverTv;
