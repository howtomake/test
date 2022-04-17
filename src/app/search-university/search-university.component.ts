import { Component, OnInit, ViewChild } from '@angular/core';
import { catchError, debounceTime, finalize, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AppService } from 'src/app/app.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-search-university',
  templateUrl: './search-university.component.html',
  styleUrls: ['./search-university.component.scss'],
})
export class SearchUniversityComponent implements OnInit {
  process!: boolean;

  countryName = new FormControl();
  universityName = new FormControl();

  filteredOptions!: Observable<string[]>;
  dataSource!: MatTableDataSource<IUniversity>;
  displayedColumns: string[] = [];

  errorCountry: number = 0;
  errorUniversity: boolean = false;
  errorUniversityFind: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  get hint(): boolean {
    return !this.countryName.value || (!!this.countryName.value && this.countryName.value.length < 3);
  }

  get errorList(): boolean {
    return (!!this.countryName.value && this.countryName.value.length > 2) && (this.errorCountry > 0 || this.errorUniversity);
  }

  get errorFiltered(): boolean {
    return !!this.universityName.value && (!!this.dataSource && !this.dataSource.filteredData.length);
  }

  constructor(
    private api: AppService,
  ) { }

  ngOnInit() {
    this.filteredOptions = this.countryName.valueChanges.pipe(
      debounceTime(50),
      startWith(''),
      switchMap(value => {
        if (!!value && value.length > 2) {
          return this.errorCountry === 0 || value.length < this.errorCountry
            ? this.api.getCountry(value).pipe(
              tap(() => this.errorCountry = 0),
              catchError(() => {
                this.errorCountry = value.length;
                return of([]);
              }))
            : of([]);
        }
        this.errorCountry = 0;
        this.displayedColumns = [];
        return of([]);
      }),
      map(value => !!value.length ? value.map((v: any) => v.name.common) : value),
    );

    this.universityName.valueChanges
      .pipe(debounceTime(50))
      .subscribe(value => {
        if (!!this.dataSource) {
          const val = !!value ? value : '';
          this.dataSource.filter = val.trim().toLowerCase();

          this.errorUniversityFind = !this.dataSource.filteredData.length;

          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
          }
        }
      });
  }

  onSelect() {
    this.universityName.reset();
    this.api.getUniversity(this.countryName.value.toLowerCase())
      .pipe(
        tap(() => this.process = true),
        finalize(() => this.process = false),
      )
      .subscribe(list => this.initTableData(list));
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }

  private initTableData(list: IUniversity[]) {
    this.displayedColumns = [];
    this.errorUniversity = false;

    if (!list.length) {
      this.errorUniversity = true;
      return;
    }

    list.forEach(l => delete l['state-province']); // remove emty cell
    Object.keys(list[0]).forEach(key => this.displayedColumns.push(key));

    this.paginator.length = list.length;
    this.dataSource = new MatTableDataSource(list);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator.firstPage();
  }
}
