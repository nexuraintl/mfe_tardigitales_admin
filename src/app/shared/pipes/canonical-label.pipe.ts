import { Pipe, PipeTransform } from '@angular/core';
import { formatCanonicalLabel } from '../../core/constants/tarjetas.constants';

@Pipe({
  name: 'canonicalLabel',
  standalone: true
})
export class CanonicalLabelPipe implements PipeTransform {
  transform(value?: string | null): string {
    return formatCanonicalLabel(value);
  }
}
