import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, delay, retry, shareReplay, tap } from 'rxjs/operators';
import { Product } from './product.interface';
import { LoadingService } from '../services/loading.service';
import { delayedRetry } from '../delayedRetry.operator';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = 'https://storerestservice12345.azurewebsites.net/api/products/';
  products$: Observable<Product[]>;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService) {
    this.initProducts();
  }

  initProducts() {
    let url:string = this.baseUrl + `?$orderby=ModifiedDate%20desc`;

    this.products$ = this
                      .http
                      .get<Product[]>(url)
                      .pipe(
                        retry({count:3, delay:1000}),
                       // delayedRetry(1000, 3),
                        delay(1500), // for demo...
                        tap(console.table),
                        shareReplay(),
                        catchError(error => this.handleError(error))
                      );

    this.loadingService.showLoaderUntilCompleted(this.products$);
  }

  private handleError(error: HttpErrorResponse) {
    // in a real world app, you may send the error to the server using some remote logging infrastructure
    // instead of just logging it to the console
    let errorMsg: string;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMsg = 'An error occurred:' + error.error.message;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      errorMsg = `Backend returned code ${error.status}, body was: ${error.error}`;
    }
    console.error(errorMsg);
    // return an observable with a user-facing error message
    return throwError(() => 'Something bad happened; please try again later.');
  }

  insertProduct(newProduct: Product): Observable<Product> {
    return this
              .http
              .post<Product>(this.baseUrl, newProduct)
              .pipe(
                catchError(this.handleError)
              );
  }

  deleteProduct(id: number): Observable<any> {
    return this
            .http
            .delete(this.baseUrl + id)
            .pipe(
              catchError(this.handleError)
            );
  }
}
