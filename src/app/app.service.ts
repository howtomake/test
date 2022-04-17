import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(
    private http: HttpClient,
  ) { }

  getUniversity(path: any): Observable<any> {
    return this.http.get(`http://universities.hipolabs.com/search?country=${path}`);
  }

  getCountry(path: any): Observable<any> {
    return this.http.get(`https://restcountries.com/v3.1/name/${path}`);
  }

}
