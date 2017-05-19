import { Injectable } from '@angular/core';
import { Http, URLSearchParams, Response } from '@angular/http';
import 'rxjs/add/operator/map'

@Injectable()
export class BookingService {
  private occupancyUrl = 'https://test-calendar.herokuapp.com';

  constructor(private http: Http) {}

  getOccupancy(fromMonth: number, toMonth: number) {
    let params: URLSearchParams = new URLSearchParams();

    params.set('from', this.getFirstDayOfMonth(fromMonth));
    params.set('to', this.getLastDayOfMonth(toMonth));

    return this.http.get(this.occupancyUrl, { search: params })
      .map(this.extractData);
  }


  private extractData(res: Response) {
    let body = res.json();

    let occupancy = body.calendar.reduce(function(occupancy, value) {
      var month = value.date.split('-')[1],
        source = value.status === 'booked'
          ? value.source
          : 'Blocked';

      occupancy.month[month] = occupancy.month[month] || {};
      occupancy.month[month][source] = occupancy.month[month][source] || { income: 0, nights:0 };

      occupancy.month[month][source].income += value.gbp_price || 0;
      occupancy.month[month][source].nights += value.nights || 0;

      occupancy.total[source] = occupancy.total[source] || { income: 0, nights:0 };
      occupancy.total[source].income += value.gbp_price || 0;
      occupancy.total[source].nights += value.nights || 0;

      if(value.source && occupancy.sources.indexOf(source) === -1){
        occupancy.sources.push(source);
      }

      return occupancy;
    }, {month:{},total:{},sources:[]});

    return body.calendar
      ? occupancy
      : { };
  }


  private getFirstDayOfMonth(month: number) {
    let today = new Date(),
      date = new Date(today.getFullYear(), month - 1, 1);

    return this.convertDateToEndPointFormat(date);
  }


  private getLastDayOfMonth(month: number) {
    let today = new Date(),
      date = new Date(today.getFullYear(), month, 0);

    return this.convertDateToEndPointFormat(date);
  }


  private convertDateToEndPointFormat(date: Date) {
    let dateWithoutTimezoneOffset: Date = new Date(+date - date.getTimezoneOffset() * 60 * 1000);

    return dateWithoutTimezoneOffset.toISOString().substring(0, 10);
  }

}
