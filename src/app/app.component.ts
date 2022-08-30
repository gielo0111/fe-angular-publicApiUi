import { Component, AfterViewInit, ViewChild } from '@angular/core';
// import { publicApiMock } from './const';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { MatSort, SortDirection } from '@angular/material/sort';

import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements AfterViewInit {
  title = 'publicApiUi';

  headers: string[] = ['API','Description', 'Auth', 'HTTPS', 'Cors', 'Link', 'Category'];
  // rows: ApiEntries[] = publicApiMock;

  exampleDatabase!: ExampleHttpDatabase | null;
  data = [];
  dataEntries:any = [];
  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  // dataSource = new MatTableDataSource<ApiEntries>(this.rows);
  displayedColumns = [];

  @ViewChild(MatSort)
  sort!: MatSort;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;


  constructor(private _httpClient: HttpClient) {}


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataEntries.filter = filterValue.trim().toLowerCase();
  }
  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
    this.exampleDatabase = new ExampleHttpDatabase(this._httpClient);

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.exampleDatabase!.getRepoIssues(
            this.sort.active,
            this.sort.direction,
            this.paginator.pageIndex,
          ).pipe(catchError(() => observableOf(null)));
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = data === null;

          console.log('data', data)
          if (data === null) {
            return [];
          }

          // Only refresh the result length if there is new data. In case of rate
          // limit errors, we do not want to reset the paginator to zero, as that
          // would prevent users from re-triggering requests.
          this.resultsLength = data.entries.length;
          this.dataEntries = data.entries;
          this.dataEntries = new MatTableDataSource(this.dataEntries);
          return data.entries;
        }),
      )
      .subscribe(data => (this.data = data));
  }

  columnNames = [{
    id: 'API',
    value: 'API',

  }, {
    id: 'Description',
    value: 'Description',
  },
    {
      id: 'Auth',
      value: 'Auth',
    },
    {
      id: 'HTTPS',
      value: 'HTTPS',
    },
    {
      id: 'Cors',
      value: 'Cors',
    },
    {
      id: 'Link',
      value: 'Link',
    },
    {
      id: 'Category',
      value: 'Category',
    }];
}

export interface ApiEntries {
  API: string;
  Description: string;
  Auth: string;
  HTTPS: boolean;
  Cors: string;
  Link: string;
  Category: string;
}

/** An example database that the data source uses to retrieve data for the table. */
export class ExampleHttpDatabase {
  constructor(private _httpClient: HttpClient) {}

  getRepoIssues(sort: string, order: SortDirection, page: number): Observable<any> {
    const href = 'https://api.github.com/search/issues';
    const requestUrlTemp = `${href}?q=repo:angular/components&sort=${sort}&order=${order}&page=${
      page + 1
    }`;
    const requestUrl = `https://api.publicapis.org/entries`
    console.log("API runing")

    return this._httpClient.get<any>(requestUrl);
  }
}
